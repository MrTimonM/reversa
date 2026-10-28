/**
 * ReversaEscrow contract configuration.
 * Address is populated from the contract-metadata file after deployment.
 * Set VITE_REVERSA_CONTRACT_ADDRESS in .env after deploying.
 */
import { getUsdc } from '@/onchain-facts'

// Deployed on Arc mainnet
export const ARC_MAINNET_CHAIN_ID = 5042
export const ARC_TESTNET_CHAIN_ID = 5042002

// Active chain — mainnet
export const ACTIVE_CHAIN_ID = ARC_MAINNET_CHAIN_ID

export const USDC_FACT = getUsdc(ACTIVE_CHAIN_ID)!
export const USDC_ADDRESS = USDC_FACT.address as `0x${string}`
export const USDC_DECIMALS = USDC_FACT.decimals

export const REVERSA_ADDRESS_RAW: string = (import.meta.env.VITE_REVERSA_CONTRACT_ADDRESS as string | undefined) ?? ''
export const REVERSA_ADDRESS = REVERSA_ADDRESS_RAW as `0x${string}`
export const REVERSA_DEPLOYED = REVERSA_ADDRESS_RAW.length > 0

export const REVERSA_ABI = [
  // Write
  {
    type: 'function', name: 'createCourse', stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'refundWindow', type: 'uint256' },
    ],
    outputs: [{ name: 'courseId', type: 'uint256' }],
  },
  {
    type: 'function', name: 'updateCourse', stateMutability: 'nonpayable',
    inputs: [
      { name: 'courseId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'refundWindow', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'purchaseCourse', stateMutability: 'nonpayable',
    inputs: [
      { name: 'courseId', type: 'uint256' },
      { name: 'expectedPrice', type: 'uint256' },
      { name: 'expectedRefundWindow', type: 'uint256' },
    ],
    outputs: [{ name: 'purchaseId', type: 'uint256' }],
  },
  {
    type: 'function', name: 'requestRefund', stateMutability: 'nonpayable',
    inputs: [{ name: 'purchaseId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'releasePayment', stateMutability: 'nonpayable',
    inputs: [{ name: 'purchaseId', type: 'uint256' }],
    outputs: [],
  },
  // Read
  {
    type: 'function', name: 'getCourse', stateMutability: 'view',
    inputs: [{ name: 'courseId', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'courseId', type: 'uint256' },
        { name: 'creator', type: 'address' },
        { name: 'price', type: 'uint256' },
        { name: 'refundWindow', type: 'uint256' },
        { name: 'active', type: 'bool' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
      ],
    }],
  },
  {
    type: 'function', name: 'getPurchase', stateMutability: 'view',
    inputs: [{ name: 'purchaseId', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'purchaseId', type: 'uint256' },
        { name: 'courseId', type: 'uint256' },
        { name: 'student', type: 'address' },
        { name: 'creator', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'refundWindow', type: 'uint256' },
        { name: 'purchasedAt', type: 'uint256' },
        { name: 'refundDeadline', type: 'uint256' },
        { name: 'status', type: 'uint8' },
      ],
    }],
  },
  {
    type: 'function', name: 'getStudentPurchaseIds', stateMutability: 'view',
    inputs: [{ name: 'student', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'getCreatorPurchaseIds', stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'getCreatorCourseIds', stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'getRefundTimeRemaining', stateMutability: 'view',
    inputs: [{ name: 'purchaseId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'usdcToken', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'nextCourseId', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'nextPurchaseId', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events
  {
    type: 'event', name: 'CourseCreated',
    inputs: [
      { name: 'courseId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'refundWindow', type: 'uint256', indexed: false },
      { name: 'title', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event', name: 'PurchaseMade',
    inputs: [
      { name: 'purchaseId', type: 'uint256', indexed: true },
      { name: 'courseId', type: 'uint256', indexed: true },
      { name: 'student', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'refundDeadline', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'RefundIssued',
    inputs: [
      { name: 'purchaseId', type: 'uint256', indexed: true },
      { name: 'student', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'PaymentReleased',
    inputs: [
      { name: 'purchaseId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

export const ERC20_ABI = [
  {
    type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'allowance', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Status values mirroring contract — use number constants to avoid enum comparison type errors
export const PurchaseStatus = {
  Protected: 0,
  Refunded: 1,
  Released: 2,
} as const

export type PurchaseStatusValue = typeof PurchaseStatus[keyof typeof PurchaseStatus]
