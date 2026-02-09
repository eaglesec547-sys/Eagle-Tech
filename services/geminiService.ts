
import { GoogleGenAI, Type } from "@google/genai";
import { RoadDefectType, Severity } from "../types";

const SYSTEM_INSTRUCTION = `You are the Eagle Tech Infrastructure Analyst, a state-of-the-art computer vision and road maintenance AI specialized in high-precision pavement distress detection. 
Your goal is to process road images and detect engineering-grade defects. 

DEFECT CLASSIFICATIONS:
- Longitudinal Crack: Lines following the direction of the road.
- Transverse Crack: Lines crossing horizontally.
- Alligator/Fatigue Crack: Interconnected pattern (severe structural failure).
- Edge Crack: Distress near the pavement boundary.
- Potholes: Holes or deep depressions.
- Rutting: Grooves in wheel paths.
- Bleeding: Shiny/slick surface from excess binder.
- Depression/Settlement: Localized dips.
- Surface Wear/Raveling: Roughness from aggregate loss.
- Patching/Utility Cuts: Repair areas.

PRECISION ANNOTATION RULES:
1. Use 'coordinates' for the overall bounding box.
2. Use 'polygonPoints' (normalized 0-100) to trace the exact shape of complex defects like alligator cracks or potholes.
3. Maintain objective, technical tone. 
4. Assess severity based on depth, width, and traffic safety impact.

Return valid JSON strictly following the schema.`;

export const analyzeRoadImage = async (base64Image: string, fileName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: `Perform a detailed inspection of "${fileName}". Detect all visible pavement defects, provide precise coordinates and maintenance recommendations.`,
        },
      ],
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          totalDetections: { type: Type.INTEGER },
          overallSeverityIndex: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
          detections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: [
                  'Longitudinal Crack', 'Transverse Crack', 'Alligator/Fatigue Crack', 
                  'Edge Crack', 'Block Cracking', 'Pothole', 'Rutting', 'Bleeding', 
                  'Depression/Settlement', 'Surface Wear/Raveling', 'Patching/Utility Cut'
                ] },
                severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                confidence: { type: Type.NUMBER },
                dimensions: { type: Type.STRING },
                description: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    w: { type: Type.NUMBER },
                    h: { type: Type.NUMBER }
                  },
                  required: ["x", "y", "w", "h"]
                },
                polygonPoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER }
                    }
                  },
                  description: "Normalized points (0-100) defining a polygon for precise annotation."
                }
              },
              required: ["id", "type", "severity", "confidence", "dimensions", "coordinates", "description"]
            }
          },
          maintenancePriority: { type: Type.INTEGER },
          suggestedAction: { type: Type.STRING }
        },
        required: ["status", "totalDetections", "overallSeverityIndex", "detections", "maintenancePriority", "suggestedAction"]
      },
    },
  });

  const textOutput = response.text || '{}';
  return JSON.parse(textOutput);
};
