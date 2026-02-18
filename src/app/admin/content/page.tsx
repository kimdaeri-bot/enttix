'use client';

export default function ContentPage() {
  return (
    <div>
      <h2 className="text-[24px] font-bold text-[#0F172A] mb-6">Content</h2>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        <div className="text-center py-8">
          <p className="text-[48px] mb-3">📝</p>
          <p className="text-[16px] font-semibold text-[#374151] mb-1">Content Management</p>
          <p className="text-[13px] text-[#94A3B8]">Event listings, banner images, and site content will be managed here.</p>
        </div>
      </div>
    </div>
  );
}
