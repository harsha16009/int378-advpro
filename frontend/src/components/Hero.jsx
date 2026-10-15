import React, { useRef, useEffect } from 'react';
import './Hero.css';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TiTick } from "react-icons/ti";
import { FiArrowDown } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

const Hero = ({ onShopClick }) => {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    let scrollTrigger;
    let animTrigger;

    if (video) {
      // Warm up the video
      video.load();
      
      const update = () => {
        if (video && video.duration && scrollTrigger) {
          const progress = scrollTrigger.progress;
          const time = progress * video.duration;
          // Set currentTime but throttle/sanitize it
          if (!isNaN(time) && isFinite(time)) {
            video.currentTime = time;
          }
        }
        requestAnimationFrame(update);
      };

      requestAnimationFrame(update);

      scrollTrigger = ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "+=1500",
        scrub: true,
        pin: true,
        markers: false,
      });

      animTrigger = gsap.to(contentRef.current, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "+=500",
          scrub: true,
          onLeave: () => {
            if (contentRef.current) contentRef.current.style.display = "none";
          },
          onEnterBack: () => {
            if (contentRef.current) contentRef.current.style.display = "";
          }
        }
      });
      
      // Attempt to preload/cache the video source
      setTimeout(() => {
        const src = video.currentSrc || video.src;
        if (window.fetch && src && src.startsWith('http')) {
          fetch(src)
            .then(res => res.blob())
            .then(blob => {
              const t = video.currentTime;
              video.src = URL.createObjectURL(blob);
              video.currentTime = t + 0.01;
            })
            .catch(err => console.log('Video prefetch skipped or failed', err));
        }
      }, 500);

      const handleTouchStart = () => {
        if (video) {
          video.play().then(() => video.pause()).catch(() => {});
        }
      };
      
      document.documentElement.addEventListener('touchstart', handleTouchStart, { once: true });
    }

    return () => {
      if (scrollTrigger) scrollTrigger.kill();
      if (animTrigger) animTrigger.scrollTrigger?.kill();
    };
  }, []);

  return (
    <>
      <div className="hero">
        <div className="hero-wrapper" ref={wrapperRef}>
          <div className="hero-content" ref={contentRef}>
            <h2 className="organic">ORGANIC & PURE FRESH</h2>
            <h1 className="headline">THE PERFECT FRUIT EXPERIENCE</h1>
            <button 
              onClick={onShopClick} 
              className="mt-8 px-8 py-4 bg-white text-[#8A0032] font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 hover:scale-105 transition duration-300 flex items-center space-x-2 mx-auto"
            >
              <span>Explore Marketplace</span>
              <FiArrowDown />
            </button>
          </div>
          
          <div className="sequence-container">
            <video
              ref={videoRef}
              src="/video/pom.mp4"
              className="sequence-video"
              muted
              playsInline
              preload="auto"
            />
          </div>
          
          <img src="/images/leaf.png" alt="leaf" className="leaf" />
          <img src="/images/leaf1.png" alt="leaf1" className="leaf1" />
        </div>
      </div>

      <div style={{ background: "#f9fafb", padding: "100px 24px" }}>
        <div className="juice-section">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8 mb-16">
            <div>
              <button className="juice-tag shadow-md">PREMIUM SELECTION 🍊</button>
              <h2 className="juice-title text-gray-900">DRINK YOUR JUICE. IT’S LIKE LIQUID SUNSHINE FOR YOUR BODY</h2>
            </div>
            <div className="flex flex-col gap-6">
              <p className="juice-desc text-gray-600">
                Pomegranate, citrus, and premium organic fruits are rich in vital nutrients, antioxidants, and vitamins. 
                Sourced from ethical local farms directly to your doorstep in 30 minutes.
              </p>
              
              <div className="juice-rating">
                <div>
                  <span className="text-xl">⭐️⭐️⭐️⭐️⭐️</span>
                  <p className="font-bold text-gray-900 mt-2">
                    4.9 / 5.0<br />
                    <small className="text-gray-500 font-normal">From over 12,000+ happy health lovers</small>
                  </p>
                </div>
                <div className="juice-avatars flex">
                  <img src="/images/user1.jpg" alt="User 1" />
                  <img src="/images/user2.jpg" alt="User 2" />
                  <img src="/images/user3.jpg" alt="User 3" />
                  <div className="more flex justify-center items-center font-bold font-sans">+12k</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1 Grid */}
          <div className="flex flex-col gap-12">
            <div className="juice-grid">
              <div className="juice-card group">
                <img src="/images/pom1.jpg" alt="Pomegranate Juice Selection" className="group-hover:scale-105 transition duration-500" />
                <button onClick={onShopClick} className="explore-btn">Shop Pomegranates</button>
              </div>
              <div className="juice-info flex flex-col justify-between">
                <h3>Rich In Natural Antioxidants & Vital Nutrients</h3>
                <div className="h-[2px] w-full bg-white/20 my-4"></div>
                <ul className="flex flex-col gap-4 text-white/90">
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>100% Cold-Pressed, Raw & Pure Juice</span></li>
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>No Added Sugars or Preservatives</span></li>
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>Packed with Vitamin C, K and Potassium</span></li>
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>Helps Improve Immunity & Gut Health</span></li>
                </ul>
              </div>
              <div className="juice-card group">
                <img src="/images/pom2.jpg" alt="Harvesting Pomegranates" className="group-hover:scale-105 transition duration-500 h-[350px]" />
                <button onClick={onShopClick} className="explore-btn">Explore Organic</button>
              </div>
            </div>

            {/* Row 2 Grid */}
            <div className="juice-grid">
              <div className="juice-card1 group">
                <img src="/images/pom3.jpg" alt="Pomegranate Seeds Display" className="group-hover:scale-105 transition duration-500" />
                <button onClick={onShopClick} className="explore-btn">View Special Offers</button>
              </div>
              <div className="juice-info flex flex-col justify-between">
                <h3>The Bold Taste of Nature, Freshly Prepared</h3>
                <div className="h-[2px] w-full bg-white/20 my-4"></div>
                <ul className="flex flex-col gap-4 text-white/90">
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>Farm-to-Bottle in under 2 hours</span></li>
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>Ethically sourced from sustainable orchards</span></li>
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>Eco-friendly biodegradable packaging</span></li>
                  <li className="flex items-center space-x-2"><TiTick className="text-xl" /> <span>Tested rigorously for quality & cleanliness</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
