import { User, Menu, Search, Settings } from 'lucide-react';

interface HeaderProps {
    className?: string;
    screenSize?: 'mobile' | 'tablet' | 'desktop';
    onMenuClick?: () => void;
}

export function Header({ className = '', screenSize = 'desktop', onMenuClick }: HeaderProps) {
    return (
        <header className={`
            bg-white shadow-sm border-b border-gray-200 
            sticky top-0 z-40 backdrop-blur-sm bg-white/95
            ${className}
        `}>
            <div className={`
                ${screenSize === 'mobile' ? 'px-4 py-3' : screenSize === 'tablet' ? 'px-5 py-3.5' : 'px-6 py-4'}
            `}>
                <div className="flex items-center justify-between">
                    {/* Logo y branding */}
                    <div className="flex items-center gap-3">
                        {/* Hamburger menu en móvil y tablet */}
                        {(screenSize === 'mobile' || screenSize === 'tablet') && (
                            <button
                                onClick={onMenuClick}
                                className={`
                                    rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center
                                    ${screenSize === 'tablet' ? 'p-3 min-w-[44px] min-h-[44px]' : 'p-2 min-w-[40px] min-h-[40px]'}
                                `}
                                aria-label="Abrir menú"
                            >
                                <Menu size={screenSize === 'tablet' ? 22 : 20} className="text-gray-600" />
                            </button>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <span className={`
                                ${screenSize === 'mobile' ? 'text-xl' : screenSize === 'tablet' ? 'text-2xl' : 'text-2xl'}
                            `}>🌿</span>
                            <div>
                                <h1 className={`
                                    font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent tracking-tight
                                    ${screenSize === 'mobile' ? 'text-lg' : screenSize === 'tablet' ? 'text-xl' : 'text-xl'}
                                `}>
                                    Plantuli
                                </h1>
                                {screenSize !== 'mobile' && (
                                    <p className={`
                                        text-green-600/80 font-medium
                                        ${screenSize === 'tablet' ? 'text-xs' : 'text-xs'}
                                    `}>
                                        Garden Planner
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Acciones centrales - Solo tablet */}
                    {screenSize === 'tablet' && (
                        <div className="flex items-center gap-2">
                            <button 
                                className="p-3 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Buscar plantas"
                            >
                                <Search size={20} className="text-gray-600" />
                            </button>
                            <button 
                                className="p-3 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Configuraciones"
                            >
                                <Settings size={20} className="text-gray-600" />
                            </button>
                        </div>
                    )}

                    {/* Acciones de usuario */}
                    <div className="flex items-center gap-3">
                        {screenSize === 'mobile' ? (
                            // Versión compacta para móvil
                            <button className="p-2 rounded-lg bg-gray-50 border border-gray-200 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <User size={18} className="text-gray-400" />
                            </button>
                        ) : screenSize === 'tablet' ? (
                            // Versión intermedia para tablet
                            <button className="flex items-center gap-2 px-3 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors min-h-[44px]">
                                <User size={18} className="text-gray-400" />
                                <span className="text-sm text-gray-500 font-medium">
                                    Usuario
                                </span>
                            </button>
                        ) : (
                            // Versión completa para desktop
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                <User size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-500 font-medium">
                                    Usuario
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}