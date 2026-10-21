import { currentUser, reservations, shops, designs, commitData } from '@/data/mockData';
import type { Reservation, Shop } from '@/types/models';

// Local demo source only. Replace this adapter when booking API is available.
export type ShopDiscovery = 'nearby' | 'rating' | 'open';
export function discoverShops(items: Shop[], filter: ShopDiscovery): Shop[] {
  const distance = (shop: Shop) => Number.parseFloat(shop.distance ?? '') || Infinity;
  return items.filter((shop) => filter !== 'open' || shop.isOpen).sort((a, b) =>
    (filter === 'rating' ? b.rating - a.rating : distance(a) - distance(b)) || a.id.localeCompare(b.id));
}
export function upcomingReservations(items: Reservation[], userId: string, now = new Date()) {
  return items.filter((item) => item.userId === userId &&
    (item.status === 'pending' || item.status === 'confirmed') &&
    new Date(`${item.date}T${item.time}:00`).getTime() >= now.getTime())
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}
export function readReservationHub() {
  return { shops: [...shops], upcoming: upcomingReservations(reservations, currentUser.id) };
}

export function demoBookingDates(now = new Date()) {
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index + 1);
    return { date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      day: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()], label: `${date.getMonth() + 1}/${date.getDate()}` };
  });
}

export function saveDemoReservation(reservation: Reservation) {
  if (reservations.some(item => item.id === reservation.id)) return;
  if (designs) validateBooking(reservation);
  reservations.unshift({ ...reservation, status: 'pending' });
  commitData?.();
}

export const BOOKING_TIMES = ['11:00', '12:30', '14:00', '15:30', '17:00', '18:30'];
export function validateBooking(value: Reservation, now = new Date()) {
  const shop = shops.find(s => s.id === value.shopId);
  const design = designs.find(d => d.id === value.designId);
  if (!shop || !design || !design.availableShopIds.includes(shop.id)) throw new Error('해당 샵에서 가능한 디자인을 선택해주세요.');
  if (!BOOKING_TIMES.includes(value.time) || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || new Date(value.date + 'T' + value.time + ':00').getTime() <= now.getTime()) throw new Error('예약 가능한 미래 날짜와 시간을 선택해주세요.');
  const [year,month,day] = value.date.split('-').map(Number);
  const date = new Date(year,month-1,day);
  if (date.getFullYear()!==year || date.getMonth()!==month-1 || date.getDate()!==day) throw new Error('올바른 날짜를 선택해주세요.');
  if (reservations.some(r => (r.shopId === value.shopId || r.userId === value.userId) && r.date === value.date && r.time === value.time && ['pending','confirmed'].includes(r.status))) throw new Error('이미 예약된 시간입니다. 다른 시간을 선택해주세요.');
}
export function changeReservationStatus(id: string, status: Reservation['status']) {
  const reservation = reservations.find(r => r.id === id);
  if (!reservation) throw new Error('예약을 찾을 수 없습니다.');
  const allowed: Record<Reservation['status'], Reservation['status'][]> = { pending:['confirmed','cancelled'], confirmed:['completed','cancelled'], cancelled:[], completed:[] };
  if (!allowed[reservation.status].includes(status)) throw new Error('변경할 수 없는 예약 상태입니다.');
  reservation.status = status;
  commitData?.();
}
