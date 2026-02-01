import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  NFTicket,
  TicketMinted,
  TicketTransferred,
  TicketUsed,
  MarketplaceApprovalUpdated
} from "../generated/NFTicket/NFTicket"
import { Ticket, Account, Transfer, MarketplaceApproval, ProtocolStats } from "../generated/schema"

function getOrCreateAccount(address: Address): Account {
  let account = Account.load(address.toHex())
  if (!account) {
    account = new Account(address.toHex())
    account.save()
  }
  return account
}

function getOrCreateStats(): ProtocolStats {
  let stats = ProtocolStats.load("PROTOCOL_STATS")
  if (!stats) {
    stats = new ProtocolStats("PROTOCOL_STATS")
    stats.totalTicketsMinted = BigInt.fromI32(0)
    stats.totalTicketsUsed = BigInt.fromI32(0)
    stats.totalVolume = BigInt.fromI32(0)
    stats.totalRoyalties = BigInt.fromI32(0)
    stats.save()
  }
  return stats
}

export function handleTicketMinted(event: TicketMinted): void {
  let ticket = new Ticket(event.params.tokenId.toString())
  ticket.tokenId = event.params.tokenId
  ticket.owner = getOrCreateAccount(event.params.to).id
  ticket.uri = event.params.uri
  ticket.isUsed = false
  ticket.originalPrice = BigInt.fromI32(0) // Note: Need to fetch from contract call if not in event, but adding to schema for now
  ticket.price = BigInt.fromI32(0)
  ticket.save()

  let stats = getOrCreateStats()
  stats.totalTicketsMinted = stats.totalTicketsMinted.plus(BigInt.fromI32(1))
  stats.save()
}

export function handleTicketTransferred(event: TicketTransferred): void {
  let ticket = Ticket.load(event.params.tokenId.toString())
  if (!ticket) return

  let fromAccount = getOrCreateAccount(event.params.from)
  let toAccount = getOrCreateAccount(event.params.to)

  ticket.owner = toAccount.id
  ticket.price = event.params.price
  ticket.save()

  let transfer = new Transfer(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  transfer.ticket = ticket.id
  transfer.from = fromAccount.id
  transfer.to = toAccount.id
  transfer.price = event.params.price
  transfer.royaltyAmount = event.params.royaltyAmount
  transfer.transactionHash = event.transaction.hash
  transfer.timestamp = event.block.timestamp
  transfer.save()

  let stats = getOrCreateStats()
  stats.totalVolume = stats.totalVolume.plus(event.params.price)
  stats.totalRoyalties = stats.totalRoyalties.plus(event.params.royaltyAmount)
  stats.save()
}

export function handleTicketUsed(event: TicketUsed): void {
  let ticket = Ticket.load(event.params.tokenId.toString())
  if (ticket) {
    ticket.isUsed = true
    ticket.save()

    let stats = getOrCreateStats()
    stats.totalTicketsUsed = stats.totalTicketsUsed.plus(BigInt.fromI32(1))
    stats.save()
  }
}

export function handleMarketplaceApprovalUpdated(event: MarketplaceApprovalUpdated): void {
  let approvalId = event.params.marketplace.toHex()
  let approval = new MarketplaceApproval(approvalId)
  
  // Account entity for the admin who executed it? Or the marketplace itself?
  // Schema defines account as the owner of the approval relation. 
  // For now, let's just map it loosely.
  let marketplaceAccount = getOrCreateAccount(event.params.marketplace)
  
  approval.account = marketplaceAccount.id
  approval.marketplace = event.params.marketplace
  approval.isApproved = event.params.approved
  approval.timestamp = event.block.timestamp
  approval.save()
}
