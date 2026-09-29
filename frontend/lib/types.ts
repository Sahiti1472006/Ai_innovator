// Shared TypeScript types — mirrors backend Pydantic schemas

export interface CustomerEnvironment {
  nodejs_version?: string;
  postgres_version?: string;
  redis_version?: string;
  cloud_provider?: string;
  infrastructure?: string;
  plan?: string;
  extra?: Record<string, string>;
}

export interface Customer {
  id: string;
  name: string;
  domain: string;
  plan: string;
  environment: CustomerEnvironment;
  known_issues: string[];
  preferences: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  customer_id: string;
  message: string;
  session_id?: string;
  conversation_history: ChatMessage[];
}

export interface MemoryEvent {
  operation: "recall" | "retain" | "reflect";
  status: "success" | "error" | "skipped";
  count?: number;
  items: string[];
  detail?: string;
}

export interface WhyRecommendation {
  memory_ids: string[];
  snippets: string[];
}

export interface ChatResponse {
  message: string;
  session_id: string;
  memory_events: MemoryEvent[];
  why?: WhyRecommendation;
  active_context?: string;
}

export interface InsightsRequest {
  query: string;
  customer_id?: string;
}

export interface InsightsResponse {
  text: string;
  based_on: string[];
  query: string;
}

export interface DashboardStats {
  total_tickets: number;
  resolved_tickets: number;
  open_tickets: number;
  customers_count: number;
  recurring_issues: string[];
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  status: "resolved" | "open" | "investigating";
  created_at: string;
  resolved_at?: string;
  summary: string;
  solution?: string;
  outcome: string;
  failed_attempts?: string[];
}

// UI state types
export interface UIMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  memoryEvents?: MemoryEvent[];
  why?: WhyRecommendation;
  activeContext?: string;
}
