import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { demoData } from '@/lib/api';

export default function CitiesPage() {
  const { cities } = demoData;
  const totalEvents = cities.reduce((acc, c) => acc + c.eventCount, 0);

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg pb-16">
        <Header transparent />
        <div className="max-w-[1280px] mx-auto px-4 pt-8">
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white leading-tight">
            Explore<br /><span className="text-[#2B7FFF]">Cities</span>
          </h1>
          <p className="text-[16px] text-[rgba(219,234,254,0.7)] mt-3 max-w-[500px]">
            Select a city to browse upcoming matches and secure your tickets.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-[28px] font-extrabold text-white">{cities.length}</div>
              <div className="text-[12px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[0.5px]">ACTIVE CITIES</div>
            </div>
            <div className="text-center">
              <div className="text-[28px] font-extrabold text-white">{totalEvents}</div>
              <div className="text-[12px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[0.5px]">EVENTS</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map(city => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="bg-white rounded-[16px] border border-[#E5E7EB] hover:border-[#2B7FFF] hover:shadow-lg transition-all p-6"
            >
              <h3 className="text-[20px] font-bold text-[#171717]">{city.name}</h3>
              <p className="text-[13px] text-[#6B7280] mt-1">{city.eventCount} EVENTS</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
