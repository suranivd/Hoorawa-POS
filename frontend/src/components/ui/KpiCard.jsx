import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './Card';

export default function KpiCard({
    label, value, icon: Icon, iconColor = 'text-indigo-600', iconBg = 'bg-indigo-50',
    trend = null, subtext = null, onClick = null, accentColor = 'bg-indigo-500'
}) {
    const hasTrend = trend !== null && trend !== undefined;
    const trendUp = hasTrend && trend >= 0;

    return (
        <Card
            className={`p-5 relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    
                    <div className="mt-2 flex items-center gap-2">
                        {hasTrend && (
                            <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(trend)}%
                            </div>
                        )}
                        {subtext && <p className="text-xs text-gray-500 font-medium">{subtext}</p>}
                    </div>
                </div>
                {Icon && (
                    <div className={`${iconBg} ${iconColor} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
            
            {/* Bottom Accent Bar */}
            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 group-hover:h-1.5 ${accentColor}`} style={{ width: '60%' }} />
        </Card>
    );
}