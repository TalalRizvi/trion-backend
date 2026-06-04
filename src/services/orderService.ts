import { prisma } from '../lib/prisma'
import { OrderStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'


interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface CreateOrderInput {
  tenantId:         string
  customerName:     string
  customerPhone?:   string
  deliveryAddress:  string
  items:            OrderItem[]
  totalAmount:      number
  specialRequests?: string
  callId?:          string
}

export async function createOrder(input: CreateOrderInput) {
  const order = await prisma.order.create({
    data: {
      tenantId:        input.tenantId,
      customerName:    input.customerName,
      customerPhone:   input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      items:           input.items as unknown as Prisma.JsonArray,
      totalAmount:     input.totalAmount,
      specialRequests: input.specialRequests,
      callId:          input.callId,
      status:          OrderStatus.NEW,
      statusHistory: {
        create: {
          fromStatus: 'NONE',
          toStatus:   'NEW',
          changedBy:  'system',
          notes:      'Order created from call'
        }
      }
    },
    include: {
      statusHistory: true
    }
  })

  return order
}

export async function getOrdersByTenant(tenantId: string) {
  return prisma.order.findMany({
    where:   { tenantId },
    include: { statusHistory: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateOrderStatus(
    orderId:   string,
    newStatus: string,
    changedBy: string,
    notes?:    string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new Error('Order not found')
  
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as OrderStatus,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus:   newStatus,
            changedBy,
            notes
          }
        }
      },
      include: { statusHistory: true }
    })
  }