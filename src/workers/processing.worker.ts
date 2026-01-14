import { WorkerMessage, WorkerResponse } from '@/types';

/**
 * Processing Worker - Handles heavy computational tasks
 * Includes content analysis, text processing, and other CPU-intensive operations
 */

class ProcessingWorker {
  constructor() {
    self.onmessage = this.handleMessage.bind(this);
    console.log('Processing worker initialized');
  }

  private async handleMessage(event: MessageEvent<WorkerMessage>) {
    const { id, type, data } = event.data;

    try {
      let result: any;

      switch (type) {
        case 'ANALYZE_CONTENT':
          result = await this.analyzeContent(data.content);
          break;
        
        case 'EXTRACT_KEYWORDS':
          result = await this.extractKeywords(data.text);
          break;
          
        case 'GENERATE_SUMMARY':
          result = await this.generateSummary(data.text, data.maxLength);
          break;
          
        case 'CALCULATE_READABILITY':
          result = await this.calculateReadability(data.text);
          break;
          
        case 'PROCESS_MARKDOWN':
          result = await this.processMarkdown(data.tracks);
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }

      const response: WorkerResponse = { id, type, data: result };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = { 
        id, 
        type, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
      self.postMessage(response);
    }
  }

  private async analyzeContent(content: string) {
    await this.simulateDelay(300);
    
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Calculate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words.length / 200);
    
    // Estimate difficulty based on average word and sentence length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const avgSentenceLength = words.length / sentences.length;
    
    let difficulty: 'easy' | 'medium' | 'hard';
    if (avgWordLength < 5 && avgSentenceLength < 15) {
      difficulty = 'easy';
    } else if (avgWordLength < 7 && avgSentenceLength < 25) {
      difficulty = 'medium';
    } else {
      difficulty = 'hard';
    }

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      readingTimeMinutes,
      difficulty,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    };
  }

  private async extractKeywords(text: string, maxKeywords: number = 10) {
    await this.simulateDelay(200);
    
    // Simple keyword extraction (TF-IDF-like approach)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
      'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'this', 'that', 'these', 'those', 'a', 'an', 'as', 'if', 'then', 'than', 'when', 'where', 'why', 'how',
      'what', 'which', 'who', 'whom', 'whose', 'from', 'up', 'out', 'down', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'can', 'just', 'now', 'also', 'well', 'get', 'go', 'come', 'take', 'make', 'see', 'know',
      'think', 'say', 'tell', 'ask', 'give', 'find', 'want', 'need', 'try', 'use', 'work', 'call', 'first',
      'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small',
      'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able'
    ]);
    
    const filteredWords = words.filter(word => !stopWords.has(word));
    
    // Count word frequency
    const wordFreq = new Map<string, number>();
    filteredWords.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Sort by frequency and return top keywords
    const keywords = Array.from(wordFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word, count]) => ({ word, count, relevance: count / filteredWords.length }));
    
    return keywords;
  }

  private async generateSummary(text: string, maxLength: number = 200) {
    await this.simulateDelay(400);
    
    // Simple extractive summary - get the most important sentences
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);
    
    if (sentences.length <= 3) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    // Score sentences based on word frequency and position
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    const sentenceScores = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const score = sentenceWords.reduce((sum, word) => sum + (wordFreq.get(word) || 0), 0) / sentenceWords.length;
      
      // Boost score for sentences at the beginning
      const positionBoost = index < sentences.length * 0.3 ? 1.2 : 1;
      
      return { sentence: sentence.trim(), score: score * positionBoost, index };
    });
    
    // Select top sentences
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(3, sentences.length))
      .sort((a, b) => a.index - b.index);
    
    let summary = topSentences.map(item => item.sentence).join('. ');
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }
    
    return summary;
  }

  private async calculateReadability(text: string) {
    await this.simulateDelay(100);
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    let level: string;
    if (fleschScore >= 90) level = 'Very Easy';
    else if (fleschScore >= 80) level = 'Easy';
    else if (fleschScore >= 70) level = 'Fairly Easy';
    else if (fleschScore >= 60) level = 'Standard';
    else if (fleschScore >= 50) level = 'Fairly Difficult';
    else if (fleschScore >= 30) level = 'Difficult';
    else level = 'Very Difficult';
    
    return {
      fleschScore: Math.round(fleschScore),
      level,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
      wordCount: words.length,
      sentenceCount: sentences.length,
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    // Remove common endings
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    // Count vowel groups
    const matches = word.match(/[aeiouy]{1,2}/g);
    const syllableCount = matches ? matches.length : 1;
    
    return Math.max(1, syllableCount);
  }

  private async processMarkdown(tracks: any[]) {
    await this.simulateDelay(500);
    
    // Process study tracks for markdown export
    const markdownFiles: { [filename: string]: string } = {};
    
    for (const track of tracks) {
      let content = `# ${track.name}\n\n`;
      content += `**Description:** ${track.description}\n\n`;
      content += `**Objective:** ${track.objective}\n\n`;
      
      if (track.prerequisites && track.prerequisites.length > 0) {
        content += `**Prerequisites:**\n`;
        track.prerequisites.forEach((prereq: string) => {
          content += `- ${prereq}\n`;
        });
        content += '\n';
      }
      
      if (track.milestones && track.milestones.length > 0) {
        content += `## Milestones\n\n`;
        track.milestones.forEach((milestone: any, index: number) => {
          const status = milestone.completed ? '✅' : '⏳';
          content += `### ${index + 1}. ${milestone.name} ${status}\n\n`;
          content += `${milestone.description}\n\n`;
        });
      }
      
      if (track.resources && track.resources.length > 0) {
        content += `## Resources\n\n`;
        track.resources.forEach((resource: any, index: number) => {
          content += `${index + 1}. [${resource.title}](${resource.url})\n`;
          if (resource.description) {
            content += `   - ${resource.description}\n`;
          }
        });
        content += '\n';
      }
      
      const filename = `${track.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
      markdownFiles[filename] = content;
    }
    
    return markdownFiles;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the worker
new ProcessingWorker();