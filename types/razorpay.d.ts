type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  method?: "card";
  config?: {
    display: {
      blocks: Record<string, { name: string; instruments: { method: string }[] }>;
      sequence: string[];
      preferences: { show_default_blocks: boolean };
    };
  };
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface Window {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
}
