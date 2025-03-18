export const OrderStatus = {
    PAID: 'PAID',
    ACCEPTED: 'ACCEPTED',
    READY: 'READY',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED'
};

export const DeliveryVisibleStatus = [
    OrderStatus.READY,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
];