import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi'
import { keccak256, encodePacked, parseUnits } from 'viem'
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion'
import { ERC20ABI } from '@/lib/abis/ERC20'
import { useSubmitAnswer } from './use-submit-answer'

export type SubmitAnswerOnchainParams = {
  questionId: number
  content: string
  contractAddress: string
  tokenAddress: string
  submissionCost: number
}

export function useSubmitAnswerOnchain() {
  const [step, setStep] = useState<'idle' | 'checking-allowance' | 'approving' | 'submitting' | 'storing' | 'completed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [approveHash, setApproveHash] = useState<string | null>(null)
  const [submitHash, setSubmitHash] = useState<string | null>(null)
  
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const submitAnswerMutation = useSubmitAnswer()

  // Wait for approval transaction
  const { isSuccess: approveSuccess, isLoading: approveLoading } = useWaitForTransactionReceipt({
    hash: approveHash as `0x${string}`,
  })

  // Wait for submit transaction
  const { isSuccess: submitSuccess, isLoading: submitLoading } = useWaitForTransactionReceipt({
    hash: submitHash as `0x${string}`,
  })

  const submit = async ({ questionId, content, contractAddress, tokenAddress, submissionCost }: SubmitAnswerOnchainParams) => {
    if (!address || !publicClient) {
      setError('Wallet not connected')
      return
    }

    try {
      setError(null)
      setStep('checking-allowance')

      // 1. Generate answer hash
      const answerHash = keccak256(encodePacked(['string'], [content]))

      // 2. Check current allowance
      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address, contractAddress as `0x${string}`],
      })

      const submissionCostBigInt = parseUnits((submissionCost / 1e6).toString(), 6) // Convert to proper USDC amount

      // 3. Approve USDC spending if needed
      if (!allowance || allowance < submissionCostBigInt) {
        setStep('approving')
        
        const hash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [contractAddress as `0x${string}`, submissionCostBigInt],
        })

        setApproveHash(hash)
        
        // Wait for approval to complete
        while (!approveSuccess && !approveLoading) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        if (!approveSuccess) {
          throw new Error('USDC approval transaction failed')
        }
      }

      // 4. Submit answer to contract
      setStep('submitting')
      
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: StoaQuestionABI,
        functionName: 'submitAnswer',
        args: [answerHash],
      })

      setSubmitHash(hash)

      // Wait for submission to complete
      while (!submitSuccess && !submitLoading) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!submitSuccess) {
        throw new Error('Answer submission transaction failed')
      }

      // 5. Store in database
      setStep('storing')
      
      await submitAnswerMutation.mutateAsync({
        questionId,
        userWallet: address,
        content,
        contractAddress,
        txHash: hash,
      })

      setStep('completed')
      return { txHash: hash }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setStep('idle')
      throw err
    }
  }

  return {
    submit,
    step,
    error,
    isLoading: step !== 'idle' && step !== 'completed',
    reset: () => {
      setStep('idle')
      setError(null)
      setApproveHash(null)
      setSubmitHash(null)
    }
  }
}