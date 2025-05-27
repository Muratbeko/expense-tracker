import { GOOGLE_CONFIG } from '../constants';
import type { Transaction } from '../types/index';

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface TransactionParseResult {
  amount: number;
  currency: string;
  category: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

export interface ForecastResult {
  period: string;
  totalExpenses: number;
  categoryBreakdown: Record<string, number>;
  suggestions: string[];
  trends: {
    trend: 'UP' | 'DOWN' | 'STABLE';
    confidence: number;
  };
}

class GoogleServices {
  // ========== Speech Recognition ==========
  async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      if (!GOOGLE_CONFIG.SPEECH_API_KEY) {
        throw new Error('Google Speech API key not configured');
      }

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CONFIG.SPEECH_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: 'en-US',
            },
            audio: {
              content: audioBase64,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Speech API error: ${response.status}`);
      }

      const data = await response.json();
      const transcript = data.results?.[0]?.alternatives?.[0]?.transcript;

      if (!transcript) {
        throw new Error('No speech detected');
      }

      return transcript;
    } catch (error) {
      console.error('Speech transcription error:', error);
      throw error;
    }
  }

  // ========== Gemini API ==========
  async callGemini(prompt: string): Promise<string> {
    try {
      if (!GOOGLE_CONFIG.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const response = await fetch(
        `${GOOGLE_CONFIG.GEMINI_API_URL}?key=${GOOGLE_CONFIG.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: GeminiResponse = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }

      return aiResponse;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // ========== Transaction Parsing ==========
  async parseTransactionFromText(text: string): Promise<TransactionParseResult> {
    try {
      const prompt = `Extract transaction details from: "${text}".
Return JSON with fields: amount (number), currency (string), category (string), description (string), type ("INCOME" or "EXPENSE"), date (ISO string).
Example: {"amount":14,"currency":"USD","category":"Groceries","description":"Grocery shopping","type":"EXPENSE","date":"2024-06-07T00:00:00.000Z"}`;

      const response = await this.callGemini(prompt);
      const match = response.match(/\{.*\}/s);
      
      if (!match) {
        throw new Error('Could not parse Gemini response - no JSON found');
      }

      const parsed = JSON.parse(match[0]);
      
      // Validate required fields
      if (!parsed.amount || !parsed.type || !parsed.category) {
        throw new Error('Missing required transaction fields');
      }

      return parsed as TransactionParseResult;
    } catch (error) {
      console.error('Transaction parsing error:', error);
      throw new Error('Failed to parse transaction from text');
    }
  }

  // ========== Financial Advice ==========
  async getFinancialAdvice(transactions: Transaction[], budget?: number): Promise<string> {
    try {
      const recentTransactions = transactions.slice(-10);
      const totalExpenses = recentTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalIncome = recentTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const prompt = `As a financial advisor, analyze these recent transactions and provide advice:
Recent expenses: KGS ${totalExpenses}
Recent income: KGS ${totalIncome}
Budget: ${budget ? `KGS ${budget}` : 'Not set'}

Transactions:
${recentTransactions.map(t => `${t.type}: KGS ${t.amount} - ${t.category} (${t.description})`).join('\n')}

Provide 3-4 specific, actionable financial tips based on this data. Keep response under 200 words.`;

      return await this.callGemini(prompt);
    } catch (error) {
      console.error('Financial advice generation error:', error);
      throw new Error('Failed to generate financial advice');
    }
  }

  // ========== Expense Forecasting ==========
  async generateExpenseForecast(transactions: Transaction[], period: string = 'month'): Promise<ForecastResult> {
    try {
      if (!transactions || transactions.length === 0) {
        throw new Error('No transaction data available');
      }

      const expenses = transactions.filter(tx => tx.type === 'EXPENSE');
      
      if (expenses.length === 0) {
        throw new Error('No expense data available');
      }

      const analysisData = this.analyzeTransactions(expenses);
      const prompt = this.createForecastPrompt(analysisData, period);
      
      const response = await this.callGemini(prompt);
      return this.parseForecastResponse(response, period);
    } catch (error) {
      console.error('Forecast generation error:', error);
      throw error;
    }
  }

  // ========== Private Helper Methods ==========
  private analyzeTransactions(expenses: Transaction[]) {
    const categoryTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};
    let totalAmount = 0;

    expenses.forEach(expense => {
      // Category analysis
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;

      // Monthly analysis
      const month = new Date(expense.date).toISOString().substring(0, 7);
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += expense.amount;

      totalAmount += expense.amount;
    });

    return {
      categoryTotals,
      monthlyTotals,
      totalAmount,
      averageExpense: totalAmount / expenses.length,
      transactionCount: expenses.length
    };
  }

  private createForecastPrompt(analysisData: any, period: string): string {
    return `Analyze this expense data and create a ${period} forecast:

Total expenses: KGS ${analysisData.totalAmount}
Transaction count: ${analysisData.transactionCount}
Average expense: KGS ${analysisData.averageExpense.toFixed(2)}

Category breakdown:
${Object.entries(analysisData.categoryTotals)
  .map(([category, amount]) => `${category}: KGS ${amount}`)
  .join('\n')}

Monthly totals:
${Object.entries(analysisData.monthlyTotals)
  .map(([month, amount]) => `${month}: KGS ${amount}`)
  .join('\n')}

Provide a JSON response with:
1. Forecasted total expenses for next ${period}
2. Category-wise expense breakdown
3. 3-5 spending optimization suggestions
4. Spending trend analysis (UP/DOWN/STABLE)

Format: {"totalExpenses": number, "categoryBreakdown": {}, "suggestions": [], "trend": "UP|DOWN|STABLE"}`;
  }

  private parseForecastResponse(response: string, period: string): ForecastResult {
    try {
      const match = response.match(/\{.*\}/s);
      if (!match) {
        throw new Error('No JSON found in forecast response');
      }

      const parsed = JSON.parse(match[0]);
      
      return {
        period,
        totalExpenses: parsed.totalExpenses || 0,
        categoryBreakdown: parsed.categoryBreakdown || {},
        suggestions: parsed.suggestions || [],
        trends: {
          trend: parsed.trend || 'STABLE',
          confidence: 0.8 // Default confidence
        }
      };
    } catch (error) {
      console.error('Forecast parsing error:', error);
      throw new Error('Failed to parse forecast response');
    }
  }

  // ========== Receipt Analysis ==========
  async analyzeReceiptImage(imageBase64: string): Promise<TransactionParseResult> {
    try {
      const prompt = `Analyze this receipt image and extract transaction details.
Return JSON with: amount (number), currency (string), category (string), description (string), type ("EXPENSE"), date (ISO string).
If you can't clearly read the receipt, return an error message.`;

      // Note: For actual image analysis, you'd need to use Gemini Vision API
      // This is a placeholder for the structure
      const response = await this.callGemini(prompt);
      const match = response.match(/\{.*\}/s);
      
      if (!match) {
        throw new Error('Could not parse receipt data');
      }

      return JSON.parse(match[0]) as TransactionParseResult;
    } catch (error) {
      console.error('Receipt analysis error:', error);
      throw new Error('Failed to analyze receipt');
    }
  }
}

// Export singleton instance
export const googleServices = new GoogleServices();
export default googleServices; 