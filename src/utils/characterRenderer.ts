import { Character } from '../types';

// Preload image cache for custom image URLs
const imageCache: Record<string, HTMLImageElement> = {};

export function getCachedImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  if (imageCache[url]) {
    return imageCache[url].complete && imageCache[url].naturalWidth > 0 ? imageCache[url] : null;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  imageCache[url] = img;
  return null;
}

export interface DrawCharacterParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  character: Character;
  state: 'IDLE' | 'RUNNING' | 'JUMPING' | 'SLIDING' | 'WALKING';
  frame: number;
  facingRight?: boolean;
  hasShield?: boolean;
}

export function drawCharacter(params: DrawCharacterParams) {
  const { ctx, x, y, width, height, character, state, frame, facingRight = true, hasShield = false } = params;

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);

  if (!facingRight) {
    ctx.scale(-1, 1);
  }

  // Check if character has custom image URL
  if (character.imageUrl) {
    const customImg = getCachedImage(character.imageUrl);
    if (customImg && customImg.naturalWidth > 0 && customImg.naturalHeight > 0) {
      // Slightly smaller, crisp character scale
      const renderW = width * 1.55;
      const renderH = height * 1.55;

      let bodyBob = 0;
      let bodyRot = 0;
      let scaleX = 1;
      let scaleY = 1;

      if (state === 'RUNNING' || state === 'WALKING') {
        const freq = 0.20; // Smooth, slightly relaxed running stride cadence
        bodyBob = hasShield ? 0 : Math.sin(frame * freq) * 3; // No vertical up/down bounce when shield active
        bodyRot = 0.06; // Forward sprint tilt
        scaleY = 1 + Math.sin(frame * freq) * 0.02; // Dynamic stride stretch
        scaleX = 1 - Math.sin(frame * freq) * 0.02;
      } else if (state === 'JUMPING') {
        bodyBob = -8;
        bodyRot = -0.12; // Jump angle
        scaleY = 1.08;
      } else if (state === 'SLIDING') {
        scaleY = 0.30; // Very flat against road
        scaleX = 1.38; // Aerodynamic slide stretch
        bodyRot = 0.52; // Low forward slide posture
        bodyBob = renderH * 0.34; // Dropped right down flush to road
      } else {
        // Idle gentle breathing
        bodyBob = hasShield ? 0 : Math.sin(frame * 0.08) * 2;
      }

      ctx.save();
      ctx.translate(0, bodyBob);
      ctx.rotate(bodyRot);
      ctx.scale(scaleX, scaleY);

      // --- DRAW FULL TRANSPARENT PNG CHARACTER SPRITE INTACT ---
      ctx.drawImage(
        customImg,
        -renderW / 2,
        -renderH / 2,
        renderW,
        renderH
      );

      // Shield effect: Only front & back energy arcs (nothing on top of head or bottom)
      if (hasShield) {
        ctx.save();
        // Outer soft glow layer
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, renderW * 0.46, -Math.PI * 0.22, Math.PI * 0.22);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, renderW * 0.46, Math.PI * 0.78, Math.PI * 1.22);
        ctx.stroke();

        // Core bright shield arc
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;

        // Front shield arc (right side)
        ctx.beginPath();
        ctx.arc(0, 0, renderW * 0.46, -Math.PI * 0.22, Math.PI * 0.22);
        ctx.stroke();

        // Back shield arc (left side)
        ctx.beginPath();
        ctx.arc(0, 0, renderW * 0.46, Math.PI * 0.78, Math.PI * 1.22);
        ctx.stroke();

        // Front speed/force lines
        ctx.strokeStyle = '#7DD3FC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(renderW * 0.38, -12);
        ctx.lineTo(renderW * 0.58, -12);
        ctx.moveTo(renderW * 0.32, 12);
        ctx.lineTo(renderW * 0.52, 12);
        ctx.stroke();

        ctx.restore();
      }

      // Running ground shadow
      if ((state === 'RUNNING' || state === 'WALKING') && scaleY >= 0.9) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, renderH * 0.48, renderW * 0.38, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
      return;
    }
  }

  // Cartoon Vector Rendering with Animated Limbs
  const mainColor = character.color || '#3B82F6';
  const legColor = '#1F2937'; // Dark charcoal legs
  const shoeColor = '#EF4444'; // Red sporty sneakers
  const skinColor = '#FDBA74'; // Peach/warm skin tone

  let bodyBob = 0;
  let leg1Angle = 0;
  let leg2Angle = 0;
  let arm1Angle = 0;
  let arm2Angle = 0;
  let scaleY = 1;
  let bodyRot = 0;

  if (state === 'RUNNING' || state === 'WALKING') {
    const freq = state === 'RUNNING' ? 0.3 : 0.18;
    bodyBob = Math.sin(frame * freq * 2) * 4;
    leg1Angle = Math.sin(frame * freq) * 0.8;
    leg2Angle = -leg1Angle;
    arm1Angle = -leg1Angle * 0.9;
    arm2Angle = -leg2Angle * 0.9;
    bodyRot = 0.08; // Slight forward tilt when sprinting
  } else if (state === 'JUMPING') {
    leg1Angle = 0.5; // Knee bent forward
    leg2Angle = -0.4; // Leg tucked back
    arm1Angle = -0.8; // Arms raised for balance
    arm2Angle = 0.6;
    bodyRot = -0.1;
  } else if (state === 'SLIDING') {
    scaleY = 0.32;
    bodyBob = height * 0.32;
    leg1Angle = 1.4;
    leg2Angle = 1.3;
    arm1Angle = -1.2;
    arm2Angle = -1.0;
    bodyRot = 0.6; // Hugging the ground
  } else {
    // Idle gentle breathing
    bodyBob = Math.sin(frame * 0.08) * 2;
    arm1Angle = Math.sin(frame * 0.08) * 0.1;
    arm2Angle = -arm1Angle;
  }

  ctx.translate(0, bodyBob);
  ctx.rotate(bodyRot);
  ctx.scale(1, scaleY);

  const headRadius = width * 0.28;
  const torsoW = width * 0.45;
  const torsoH = height * 0.38;

  // --- DRAW BACK ARM ---
  ctx.save();
  ctx.translate(-torsoW * 0.1, -torsoH * 0.1);
  ctx.rotate(arm2Angle);
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, height * 0.28, 4);
  ctx.fill();
  // Hand
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, height * 0.28, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- DRAW BACK LEG & SHOE ---
  ctx.save();
  ctx.translate(-torsoW * 0.2, torsoH * 0.35);
  ctx.rotate(leg2Angle);
  ctx.fillStyle = legColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, height * 0.32, 4);
  ctx.fill();
  // Shoe
  ctx.fillStyle = shoeColor;
  ctx.beginPath();
  ctx.roundRect(-6, height * 0.28, 14, 8, 3);
  ctx.fill();
  ctx.restore();

  // --- DRAW FRONT LEG & SHOE ---
  ctx.save();
  ctx.translate(torsoW * 0.15, torsoH * 0.35);
  ctx.rotate(leg1Angle);
  ctx.fillStyle = legColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, height * 0.32, 4);
  ctx.fill();
  // Shoe
  ctx.fillStyle = shoeColor;
  ctx.beginPath();
  ctx.roundRect(-6, height * 0.28, 14, 8, 3);
  ctx.fill();
  ctx.restore();

  // --- DRAW TORSO / SHIRT ---
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.roundRect(-torsoW / 2, -torsoH / 2, torsoW, torsoH, 8);
  ctx.fill();

  // Custom shirt logo or emblem
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -torsoH * 0.1, 7, 0, Math.PI * 2);
  ctx.fill();

  // --- DRAW HEAD & FACE ---
  ctx.save();
  ctx.translate(0, -torsoH / 2 - headRadius * 0.7);

  // Head circle
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Cap based on character theme
  ctx.fillStyle = character.svgType === 'ninja_appa' ? '#111827' :
                  character.svgType === 'cyber_hasu' ? '#06B6D4' :
                  character.svgType === 'golden_king' ? '#F59E0B' : '#1E293B';

  ctx.beginPath();
  ctx.arc(0, -2, headRadius + 1, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();

  // Expressive Big Cartoon Eye
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(headRadius * 0.35, -headRadius * 0.1, 6, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupil
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(headRadius * 0.45, -headRadius * 0.1, 3, 0, Math.PI * 2);
  ctx.fill();

  // Pupil shine
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(headRadius * 0.48, -headRadius * 0.2, 1, 0, Math.PI * 2);
  ctx.fill();

  // Happy Smile
  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(headRadius * 0.2, headRadius * 0.25, 5, 0.1, Math.PI * 0.9);
  ctx.stroke();

  ctx.restore(); // end head

  // --- DRAW FRONT ARM ---
  ctx.save();
  ctx.translate(torsoW * 0.2, -torsoH * 0.1);
  ctx.rotate(arm1Angle);
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, height * 0.28, 4);
  ctx.fill();
  // Hand
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, height * 0.28, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
