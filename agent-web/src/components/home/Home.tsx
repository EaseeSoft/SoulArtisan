import React from 'react';
import Navbar from '../layout/Navbar';
import Hero from './Hero';
import Features from './Features';
import Footer from '../layout/Footer';

const Home: React.FC = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </>
  );
};

export default Home;