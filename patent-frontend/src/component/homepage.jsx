import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Homepage = () => {
  return (
    <div className="max-w-7xl mx-auto p-8 bg-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-16">
        <h1 className="text-2xl font-bold">INVENTRA</h1>
        <Button 
          variant="outline" 
          className="rounded-full border-2 border-black text-black hover:bg-transparent"
        >
          connect wallet
        </Button>
      </header>

      {/* Hero Section */}
      <div className="bg-[#1E2A47] text-white rounded-3xl p-16 mb-16">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold mb-8">
            Invest in and advance real science
          </h2>
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-gray-100 rounded-lg"
          >
            Join&Trade
          </Button>
        </div>
      </div>

      {/* Patents Section */}
      <section>
        <h3 className="text-2xl font-semibold text-center mb-8">Newest Patent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <Card 
              key={item} 
              className="aspect-square rounded-2xl bg-gray-200 p-4 hover:shadow-lg transition-shadow"
            >
              {/* Patent card content will go here */}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Homepage;