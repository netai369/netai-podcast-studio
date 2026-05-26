export const GoogleGenAI = jest.fn().mockImplementation(() => ({
  models: {
    generateContentStream: jest.fn().mockImplementation(() => ({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ done: true })
      })
    })),
    generateContent: jest.fn().mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            text: '{"title": "Test Podcast", "description": "Test description"}'
          }]
        }
      }]
    })
  }
}));

export const Modality = {
  AUDIO: 'AUDIO'
};

export const Type = {
  OBJECT: 'OBJECT',
  STRING: 'STRING'
};
