import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-8 md:py-12 bg-[#F5F7FA]">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[13px] text-[#6B7280] hover:text-[#171717]">Privacy Policy</Link>
            <Link href="/terms" className="text-[13px] text-[#6B7280] hover:text-[#171717]">Terms of Service</Link>
            <Link href="/help" className="text-[13px] text-[#6B7280] hover:text-[#171717]">Help Center</Link>
            <Link href="/contact" className="text-[13px] text-[#6B7280] hover:text-[#171717]">Contact Us</Link>
          </div>
        </div>
        <div className="border-t border-[#E5E7EB] pt-6 text-center text-[12px] text-[#9CA3AF] leading-[20px]">
          <p>상호명: 디플랫코리아|대표: 정경준|연락처: 02-3788-9175</p>
          <p>사업자 번호: 604-49-00650|통신판매번호: 2024-안양동안-0733</p>
          <p>개인정보 관리 책임자: 정경준</p>
          <p>주소: 서울시 강서구 마곡서로 152 두산 더 랜드타워 A동 502호</p>
          <p className="mt-3">© 2026 Enttix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
