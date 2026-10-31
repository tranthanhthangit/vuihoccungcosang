import jsQR from 'jsqr';
import { QRCardAnswer } from '../types/qrQuiz';

export interface QRDetectionResult {
  token: string;
  studentToken?: string; // alias
  answer: QRCardAnswer;
  angleDegrees: number; // -180 to +180
  angle?: number;       // alias
  confidence: number;   // 0.0 to 1.0
  corners: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
  center: { x: number; y: number };
  rawPayload: string;
}

/**
 * Calculates the orientation angle of a detected QR code and maps it to answer A, B, C, or D.
 * 
 * Card Design Convention:
 * - A is at the physical TOP of the unrotated card (theta ~ -90 deg in screen coordinates where Y is down).
 * - B is at the physical RIGHT of the card (rotating B to top turns A to the right, theta ~ 0 deg).
 * - C is at the physical BOTTOM of the card (rotating C to top turns A downwards, theta ~ +90 deg).
 * - D is at the physical LEFT of the card (rotating D to top turns A to the left, theta ~ 180 deg).
 */
export function determineQRAnswerFromCorners(
  tl: { x: number; y: number },
  tr: { x: number; y: number },
  bl: { x: number; y: number },
  br: { x: number; y: number },
  isMirrored: boolean = false
): { answer: QRCardAnswer; angleDegrees: number; confidence: number } {
  // Center of the QR code
  const cx = (tl.x + tr.x + bl.x + br.x) / 4;
  const cy = (tl.y + tr.y + bl.y + br.y) / 4;

  // Midpoint of the QR code's native top edge (from top-left to top-right finder)
  const topMidX = (tl.x + tr.x) / 2;
  const topMidY = (tl.y + tr.y) / 2;

  // Vector pointing from center to native top
  let vx = topMidX - cx;
  const vy = topMidY - cy;

  if (isMirrored) {
    vx = -vx;
  }

  // Angle in degrees: 
  // Pointing UP (-Y): -90 deg
  // Pointing RIGHT (+X): 0 deg
  // Pointing DOWN (+Y): +90 deg
  // Pointing LEFT (-X): +-180 deg
  const angleRad = Math.atan2(vy, vx);
  let angleDeg = (angleRad * 180) / Math.PI;

  // Normalize angle to [-180, 180]
  while (angleDeg > 180) angleDeg -= 360;
  while (angleDeg <= -180) angleDeg += 360;

  let answer: QRCardAnswer;
  let targetAngle: number;

  if (angleDeg >= -135 && angleDeg < -45) {
    answer = 'A';
    targetAngle = -90;
  } else if (angleDeg >= -45 && angleDeg < 45) {
    answer = 'B';
    targetAngle = 0;
  } else if (angleDeg >= 45 && angleDeg < 135) {
    answer = 'C';
    targetAngle = 90;
  } else {
    answer = 'D';
    targetAngle = angleDeg > 0 ? 180 : -180;
  }

  // Calculate confidence based on proximity to target quadrant angle (maximum deviation is 45 deg)
  const deviation = Math.min(
    Math.abs(angleDeg - targetAngle),
    Math.abs(Math.abs(angleDeg) - 180)
  );
  // Confidence scale: 1.0 at 0 deviation, down to 0.5 at 45 deg deviation
  const confidence = Math.max(0.5, Math.min(1.0, 1 - (deviation / 45) * 0.5));

  return {
    answer,
    angleDegrees: Math.round(angleDeg),
    confidence: Number(confidence.toFixed(2)),
  };
}

/**
 * Scans an ImageData from canvas and returns all decoded QR results with orientation
 */
export function scanImageDataForQR(
  imageData: ImageData,
  isMirrored: boolean = false
): QRDetectionResult | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  if (!code || !code.data) {
    return null;
  }

  const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = code.location;

  const orientation = determineQRAnswerFromCorners(
    topLeftCorner,
    topRightCorner,
    bottomLeftCorner,
    bottomRightCorner,
    isMirrored
  );

  const center = {
    x: (topLeftCorner.x + topRightCorner.x + bottomRightCorner.x + bottomLeftCorner.x) / 4,
    y: (topLeftCorner.y + topRightCorner.y + bottomRightCorner.y + bottomLeftCorner.y) / 4,
  };

  // Extract clean student token if formatted like "VHQ:STU01" or raw string
  let token = code.data.trim();
  if (token.startsWith('VHQ:')) {
    token = token.substring(4);
  }

  return {
    token,
    studentToken: token,
    answer: orientation.answer,
    angleDegrees: orientation.angleDegrees,
    angle: orientation.angleDegrees,
    confidence: orientation.confidence,
    corners: {
      topLeft: topLeftCorner,
      topRight: topRightCorner,
      bottomRight: bottomRightCorner,
      bottomLeft: bottomLeftCorner,
    },
    center,
    rawPayload: code.data,
  };
}
