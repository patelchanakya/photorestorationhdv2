"use client";
import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
    active: boolean;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    gravity: number;
    rotation: number;
    rotationSpeed: number;
}

const Confetti: React.FC<ConfettiProps> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'];

        particles.current = Array.from({ length: 50 }, (): Particle => ({
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedX: (Math.random() - 0.5) * 12,
            speedY: -Math.random() * 15 - 5,
            gravity: 0.7,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8
        }));

        let frame = 0;
        const maxFrames = 120;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.current.forEach((particle) => {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate((particle.rotation * Math.PI) / 180);

                ctx.fillStyle = particle.color;
                ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

                ctx.restore();

                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.speedY += particle.gravity;
                particle.rotation += particle.rotationSpeed;
            });

            frame++;

            if (frame < maxFrames) {
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [active]);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            width={typeof window !== 'undefined' ? window.innerWidth : 800}
            height={typeof window !== 'undefined' ? window.innerHeight : 600}
        />
    );
};

export default Confetti;