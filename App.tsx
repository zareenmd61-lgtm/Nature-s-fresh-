/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Apple, 
  Fish, 
  ShoppingBasket, 
  Video as VideoIcon,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { generateVideo } from './services/geminiService';
import { AppState, GenerateVideoParams, Resolution } from './types';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import LoadingIndicator from './components/LoadingIndicator';
import ApiKeyDialog from './components/ApiKeyDialog';
import { Video } from '@google/genai';

// Product Data
type ProductItem = {
  id: string;
  name: string;
  price: string;
  description?: string;
};

type ProductCategory = {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
  items: ProductItem[];
};

const PRODUCTS_DATA: ProductCategory[] = [
  {
    id: 'vegetables',
    title: 'Organic Vegetables',
    icon: Leaf,
    description: 'Farm-fresh, pesticide-free vegetables for your daily nutrition.',
    color: 'bg-green-600',
    items: []
  },
  {
    id: 'fruits',
    title: 'Natural Fruits',
    icon: Apple,
    description: 'Seasonally picked, naturally ripened fruits bursting with flavor.',
    color: 'bg-red-500',
    items: []
  },
  {
    id: 'fish',
    title: 'Fresh Fish',
    icon: Fish,
    description: 'Premium quality catch, cleaned and prepped for your convenience.',
    color: 'bg-blue-500',
    items: [
      {
        id: 'murrel-fillet',
        name: 'Murrel (Maral) Fillet - Boneless',
        price: '₹880/kg',
        description: 'Best for wound healing & surgery'
      },
      {
        id: 'basa-fillet',
        name: 'Fatless Basa - Boneless',
        price: '₹500/kg',
        description: 'High protein, good for diet'
      },
      {
        id: 'apollo-boneless',
        name: 'Apollo Boneless',
        price: '₹400/kg',
        description: 'Small boneless cubes. Safe for kids'
      },
      {
        id: 'murrel-curry',
        name: 'Murrel (Maral) - Curry Cut',
        price: '₹500/kg',
        description: 'With bone. Great for skin & recovery'
      },
      {
        id: 'rohu-curry',
        name: 'Rohu - Curry Cut',
        price: '₹250/kg',
        description: 'River Fish. Rich in Omega-3'
      },
      {
        id: 'tilapia-curry',
        name: 'Tilapia - Curry Cut',
        price: '₹220/kg',
        description: 'Good for bone strength'
      },
      {
        id: 'prawns',
        name: 'Cleaned Prawns (Tiger/Jumbo)',
        price: '₹600–800',
        description: 'Boosts immunity & zinc levels'
      }
    ]
  },
  {
    id: 'chicken',
    title: 'Organic Poultry',
    icon: ShoppingBasket,
    description: 'Free-range, chemical-free poultry for natural strength.',
    color: 'bg-orange-500',
    items: [
      {
        id: 'country-chicken',
        name: 'Country Chicken',
        price: '₹450/kg',
        description: 'Chemical-free, Natural Strength'
      },
      {
        id: 'quail',
        name: 'Quail (Batir)',
        price: '₹100/pc',
        description: 'Cures asthma, improves energy'
      }
    ]
  },
  {
    id: 'grocery',
    title: 'Healthy Grocery',
    icon: ShoppingBasket,
    description: 'Natural food products chosen with care.',
    color: 'bg-amber-600',
    items: []
  }
];

function App() {
  // Video Generation State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedVideo, setGeneratedVideo] = useState<{
    url: string;
    blob: Blob;
    uri: string;
    video: Video;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<GenerateVideoParams | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [pendingParams, setPendingParams] = useState<GenerateVideoParams | null>(null);

  // Product Tab State
  const [activeCategory, setActiveCategory] = useState<string>('fish');

  // Video Generation Handlers
  const handleGenerate = async (params: GenerateVideoParams, skipKeyCheck = false) => {
    try {
      if (!skipKeyCheck) {
        const hasKey = await window.aistudio?.hasSelectedApiKey();
        if (!hasKey) {
          setPendingParams(params);
          setShowKeyDialog(true);
          return;
        }
      }

      setAppState(AppState.LOADING);
      setError(null);
      setLastParams(params);

      const result = await generateVideo(params);
      setGeneratedVideo({
        url: result.objectUrl,
        blob: result.blob,
        uri: result.uri,
        video: result.video,
      });
      setAppState(AppState.SUCCESS);
    } catch (e: any) {
      console.error('Generation failed:', e);
      if (e.message?.includes('Requested entity was not found')) {
         setPendingParams(params);
         setShowKeyDialog(true);
         return;
      }
      setError(e.message || 'An unexpected error occurred');
      setAppState(AppState.ERROR);
    }
  };

  const handleKeySelected = async () => {
    setShowKeyDialog(false);
    if (pendingParams) {
      // Race condition mitigation: assume success and skip check
      handleGenerate(pendingParams, true);
      setPendingParams(null);
    }
  };

  const handleOpenKeyDialog = async () => {
    try {
        await window.aistudio?.openSelectKey();
        // Assume success as per instructions to mitigate race condition
        handleKeySelected();
    } catch(e) {
        console.error("Error selecting key", e);
        setShowKeyDialog(false);
        setPendingParams(null);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      {showKeyDialog && <ApiKeyDialog onContinue={handleOpenKeyDialog} />}
      
      {/* Header */}
      <header className="bg-green-800 text-white py-4 sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-300" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Nature's Fresh</h1>
              <p className="text-xs text-green-200">Eat Natural · Live Healthy</p>
            </div>
          </div>
          <a 
            href="https://wa.me/9182373800" 
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Order Now</span>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-16">
        
        {/* Intro Section */}
        <section className="text-center max-w-3xl mx-auto animate-fadeIn">
          <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
            Pure, Fresh & Chemical-Free
          </h2>
          <p className="text-lg text-green-800/80 leading-relaxed mb-6">
            A social health initiative by Deccan Multi Services. We bring you the best from nature — Organic Vegetables, Natural Fruits, Fresh Fish, and Desi Chicken.
          </p>
          <div className="inline-block bg-green-100 border border-green-200 rounded-lg px-6 py-3 text-green-800 font-medium">
            Not a business, but a mission to spread health awareness.
          </div>
        </section>

        {/* Video Studio Section */}
        <section className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl text-white animate-fadeInUp delay-100">
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <VideoIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Nature's Video Studio</h2>
                <p className="text-gray-400">Create videos with Veo</p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              {appState === AppState.IDLE || appState === AppState.ERROR ? (
                <div className="space-y-6">
                  <PromptForm 
                    onGenerate={handleGenerate} 
                    initialValues={lastParams}
                  />
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-center">
                      {error}
                    </div>
                  )}
                </div>
              ) : appState === AppState.LOADING ? (
                <LoadingIndicator />
              ) : (
                <VideoResult 
                  videoUrl={generatedVideo!.url}
                  onRetry={() => setAppState(AppState.IDLE)}
                  onNewVideo={() => {
                    setGeneratedVideo(null);
                    setAppState(AppState.IDLE);
                    setLastParams(null);
                  }}
                  onExtend={() => {
                    setLastParams({
                      ...lastParams!,
                      mode: 'Extend Video' as any, // Cast to fix strict enum type in TS
                      inputVideo: null, // User needs to re-upload or we handle blobs differently
                      inputVideoObject: generatedVideo!.video
                    });
                    setGeneratedVideo(null);
                    setAppState(AppState.IDLE);
                  }}
                  canExtend={lastParams?.resolution === Resolution.P720}
                />
              )}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="animate-fadeInUp delay-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-green-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-green-900">Our Offerings</h2>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-hide">
            {PRODUCTS_DATA.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap transition-all font-medium
                    ${isActive 
                      ? `${category.color} text-white shadow-lg scale-105` 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {category.title}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS_DATA.find(c => c.id === activeCategory)?.items.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-green-100/50">
                <Leaf className="w-12 h-12 text-green-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-green-800">Coming Soon</h3>
                <p className="text-green-600/60 mt-2">We are sourcing the freshest {PRODUCTS_DATA.find(c => c.id === activeCategory)?.title.toLowerCase()} for you.</p>
              </div>
            ) : (
              PRODUCTS_DATA.find(c => c.id === activeCategory)?.items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col p-6"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">
                        {item.name}
                      </h3>
                      <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ml-2">
                        {item.price}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 mb-6">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  <a 
                    href={`https://wa.me/9182373800?text=I'm interested in ${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-auto"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Order on WhatsApp
                  </a>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Contact Footer */}
        <section className="bg-green-900 rounded-3xl p-8 md:p-12 text-white text-center animate-fadeInUp delay-300">
          <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-full">
                <div className="w-6 h-6 flex items-center justify-center font-bold">📞</div>
              </div>
              <div className="text-left">
                <div className="text-green-300 text-sm font-medium">Call for orders</div>
                <div className="font-bold text-lg">9182373800</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-full">
                <div className="w-6 h-6 flex items-center justify-center font-bold">📧</div>
              </div>
              <div className="text-left">
                <div className="text-green-300 text-sm font-medium">Email us</div>
                <div className="font-bold text-lg">mohmmedasifuddin@gmail.com</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center text-green-800/40 text-sm pb-8">
          © {new Date().getFullYear()} Nature's Fresh. All rights reserved.
        </footer>

      </main>
    </div>
  );
}

export default App;