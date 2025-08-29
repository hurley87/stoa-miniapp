import { Address } from 'viem';

export const STOA_FACTORY_ADDRESS: Address =
  '0xf3CE4f710BE6433BCDBAabaa9885bde961b51123';

// Minimal ABI required for creating a question and decoding events
export const STOA_FACTORY_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_treasury', type: 'address', internalType: 'address' },
      { name: '_protocolRegistry', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allQuestions',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createQuestion',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'submissionCost', type: 'uint256', internalType: 'uint256' },
      { name: 'duration', type: 'uint256', internalType: 'uint256' },
      { name: 'maxWinners', type: 'uint8', internalType: 'uint8' },
      { name: 'seedAmount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAllQuestions',
    inputs: [],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isWhitelisted',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'protocolRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract StoaProtocol' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'questionCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'treasury',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'whitelistCreator',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'allowed', type: 'bool', internalType: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'QuestionCreated',
    inputs: [
      {
        name: 'questionId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'question',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'creator',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'submissionCost',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'duration',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'maxWinners',
        type: 'uint8',
        indexed: false,
        internalType: 'uint8',
      },
      {
        name: 'seedAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
] as const;

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
