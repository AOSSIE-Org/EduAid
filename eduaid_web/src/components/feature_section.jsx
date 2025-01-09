import React from "react";

const FeaturesSection = () => {
  const features = [
    {
      title: "Doc/Audio Input",
      position: "left",
    },
    {
      title: "In-depth Questions Generation",
      position: "right",
    },
    {
      title: "Dynamic Google Form Integration",
      position: "left",
    },
  ];

  return (
    <div className="relative w-full bg-transparent">
      {/* Extended background container */}
      <div className="absolute inset-0 w-full overflow-hidden">
        {/* Background geometric patterns - now full width */}
        <div className="absolute inset-0 opacity-20">
          {/* Horizontal lines - extended */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7877C6] to-transparent" />
          <div className="absolute top-2/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7877C6] to-transparent" />

          {/* Diagonal lines - extended */}
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#7877C6] to-transparent transform -rotate-45" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent transform rotate-45" />

          {/* Circular elements - positioned relative to viewport */}
          <div className="absolute top-1/4 left-1/4 w-40 h-40 border border-[#7877C6]/30 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-purple-500/30 rounded-full" />

          {/* Grid pattern - extended */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(120,119,198, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(120,119,198, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "2rem 2rem",
            }}
          />
        </div>
      </div>

      {/* Content container - maintained original size */}
      <div className="relative h-[500px] w-96 mx-auto">
        {/* Main vertical glowing line */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#7877C6]/0 via-[#7877C6] to-[#7877C6]/0 
                    after:absolute after:w-[2px] after:h-full after:bg-gradient-to-b after:from-transparent after:via-[#7877C6] after:to-transparent after:blur-sm
                    before:absolute before:w-[1px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-[#7877C6] before:to-transparent before:blur-md"
        />

        {/* Pulsing dots */}
        <div className="absolute left-1/2 top-1/4 w-2 h-2 -ml-1 bg-[#7877C6] rounded-full animate-pulse" />
        <div className="absolute left-1/2 top-2/4 w-2 h-2 -ml-1 bg-purple-500 rounded-full animate-pulse" />
        <div className="absolute left-1/2 top-3/4 w-2 h-2 -ml-1 bg-[#7877C6] rounded-full animate-pulse" />

        {/* Features content */}
        <div className="relative space-y-12 py-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex items-center gap-4 ${
                feature.position === "left" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div
                className={`w-1/2 ${
                  feature.position === "left"
                    ? "text-right pr-4"
                    : "text-left pl-4"
                }`}
              >
                <div
                  className={`p-4 rounded-lg bg-neutral-900/80 backdrop-blur-sm border border-[#7877C6]/20 
                            relative overflow-hidden group transition-all duration-300
                            hover:border-[#7877C6]/50 hover:bg-neutral-900/90
                            ${feature.position === "left" ? "mr-4" : "ml-4"}`}
                >
                  {/* Card background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7877C6]/0 via-[#7877C6]/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Corner accent lines */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#7877C6]/30" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/30" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 justify-center">
                      <h3 className="text-base font-bold bg-gradient-to-r from-[#7877C6] to-purple-500 bg-clip-text text-transparent">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
