"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { drawScene, SceneState } from "@/lib/canvasScene";
import { Particle, updateParticle } from "@/lib/particles";

interface WorldCanvasProps {
  buildingStage: number;
  workerCounts: Record<string, number>;
  particles: Particle[];
  onParticlesUpdate: (updater: (prev: Particle[]) => Particle[]) => void;
}

export default function WorldCanvas({
  buildingStage,
  workerCounts,
  particles,
  onParticlesUpdate,
}: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>(particles);

  // Keep particlesRef in sync
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  const renderLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      timeRef.current += dt;

      // Resize check
      const parent = canvas.parentElement;
      if (parent) {
        const pw = parent.clientWidth;
        const ph = parent.clientHeight;
        if (canvas.width !== pw || canvas.height !== ph) {
          canvas.width = pw;
          canvas.height = ph;
        }
      }

      // Day/night: complete cycle every 5 minutes
      const cycleLength = 300; // seconds
      const dayNightPhase = (timeRef.current % cycleLength) / cycleLength;

      // Update particles
      const updatedParticles = particlesRef.current.filter((p) => updateParticle(p, dt));
      if (updatedParticles.length !== particlesRef.current.length) {
        onParticlesUpdate(() => updatedParticles);
      }

      const scene: SceneState = {
        time: timeRef.current,
        buildingStage,
        workerCounts,
        particles: updatedParticles,
        dayNightPhase,
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawScene(ctx, canvas.width, canvas.height, scene);

      animFrameRef.current = requestAnimationFrame(renderLoop);
    },
    [buildingStage, workerCounts, onParticlesUpdate]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderLoop]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{
        imageRendering: "auto",
        touchAction: "none",
      }}
      aria-label="Pizza Empire 2D world scene"
      role="img"
    />
  );
}
