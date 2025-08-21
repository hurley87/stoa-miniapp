import { Address } from 'viem';

export const STOA_FACTORY_ADDRESS: Address =
  '0x4C8c62Dcb1eBCC2A19963b64Ba02ee3132ce9F48';

// Minimal ABI required for creating a question and decoding events
export const STOA_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'submissionCost', type: 'uint256' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'uint8', name: 'maxWinners', type: 'uint8' },
      { internalType: 'uint256', name: 'seedAmount', type: 'uint256' },
    ],
    name: 'createQuestion',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'questionCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'questionId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'question',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'submissionCost',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'maxWinners',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'seedAmount',
        type: 'uint256',
      },
    ],
    name: 'QuestionCreated',
    type: 'event',
  },
];

export type QuestionCreatedEvent = {
  questionId: bigint;
  question: Address;
  creator: Address;
  token: Address;
  submissionCost: bigint;
  duration: bigint;
  maxWinners: number;
  seedAmount: bigint;
};
