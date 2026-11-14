import React from 'react';

const GOL_G2_SHOWROOM_IMAGE =
  '/assets/aistudio/Gemini_Generated_Image_6xc6z86xc6z86xc6_bbc8c38e.jfif';

export const GolShowroomView: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#09090B] overflow-hidden">
      <img
        src={GOL_G2_SHOWROOM_IMAGE}
        alt="Volkswagen Gol G2 Showroom"
        draggable={false}
        className="w-full h-full object-cover object-center block select-none"
      />
    </div>
  );
};
