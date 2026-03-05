'use client';
import Link from 'next/link';
import Header from '@/components/Header';

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <div className="max-w-[480px] mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">🎭</div>
        <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-3">예매 완료!</h1>
        <p className="text-[#64748B] text-[15px] mb-8">
          티켓 예매가 성공적으로 완료되었습니다.<br/>
          확인 이메일이 발송될 예정입니다.
        </p>
        <Link href="/musical/west-end" className="inline-block px-8 py-4 bg-[#2B7FFF] text-white rounded-xl font-bold hover:bg-[#1D6AE5]">
          공연 더 보기
        </Link>
      </div>
    </main>
  );
}
