import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NCarousel from '../NCarousel';

describe('NCarousel', () => {
  const defaultSlides = [
    <div key="1">Slide 1</div>,
    <div key="2">Slide 2</div>,
    <div key="3">Slide 3</div>
  ];

  it('renders all slides', () => {
    render(<NCarousel>{defaultSlides}</NCarousel>);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  it('renders with default options', () => {
    render(<NCarousel>{defaultSlides}</NCarousel>);
    
    const carousel = document.querySelector('.n-carousel__content');
    expect(carousel).toBeInTheDocument();
  });

  it('applies custom options', () => {
    const options = {
      vertical: true,
      endless: true,
      autoHeight: true
    };

    render(<NCarousel options={options}>{defaultSlides}</NCarousel>);
    
    const carousel = document.querySelector('.n-carousel');
    expect(carousel).toHaveClass('n-carousel--vertical');
    expect(carousel).toHaveClass('n-carousel--endless');
    expect(carousel).toHaveClass('n-carousel--auto-height');
  });

  it('renders navigation controls', () => {
    render(<NCarousel>{defaultSlides}</NCarousel>);
    
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
}); 