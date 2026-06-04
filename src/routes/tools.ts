import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { createOrder } from '../services/orderService'

const router = Router()

const CreateOrderSchema = z.object({
  tenant_id:        z.string(),
  customer_name:    z.string(),
  customer_phone:   z.string().optional(),
  delivery_address: z.string(),
  items: z.union([
    z.array(z.object({
      name:     z.string(),
      quantity: z.number(),
      price:    z.number()
    })),
    z.string().transform((str) => JSON.parse(str))
  ]),
  total_amount:     z.union([
    z.number(),
    z.string().transform((s) => parseFloat(s))
  ]),
  special_requests: z.string().optional(),
  call_id:          z.string().optional()
})

router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const data = CreateOrderSchema.parse(req.body)

    const order = await createOrder({
      tenantId:        data.tenant_id,
      customerName:    data.customer_name,
      customerPhone:   data.customer_phone,
      deliveryAddress: data.delivery_address,
      items:           data.items as { name: string; quantity: number; price: number }[],
      totalAmount:     data.total_amount,
      specialRequests: data.special_requests,
      callId:          data.call_id
    })

    res.json({
      success:      true,
      order_id:     order.id,
      order_number: order.orderNumber,
      message:      `Order #${order.orderNumber} created successfully`
    })

  } catch (error) {
    console.error('create-order error:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to create order'
    })
  }
})

export default router