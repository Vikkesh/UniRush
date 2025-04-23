export const OrderStatus = {
    PAID: 'PAID',
    ACCEPTED: 'ACCEPTED',
    READY: 'READY',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED'
};

// Add constant for delivery visible statuses
export const DeliveryVisibleStatus = [
    OrderStatus.READY,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED
];