import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/react";
import { captureException, captureMessage, addBreadcrumb } from "@/utils/sentry";

/**
 * Test component to verify Sentry integration
 * Remove this component in production
 */
const SentryTestButton = () => {
  const testError = () => {
    addBreadcrumb('User clicked test error button', 'user-action');
    throw new Error("This is a test error for Sentry!");
  };

  const testCaptureException = () => {
    try {
      // Simulate an error in a try-catch block
      throw new Error("Caught error for testing");
    } catch (error) {
      captureException(error as Error, { 
        testType: 'manual-capture',
        userAction: 'button-click' 
      });
      alert('Error captured and sent to Sentry!');
    }
  };

  const testCaptureMessage = () => {
    captureMessage('Test message from Sentry integration', 'info');
    alert('Message sent to Sentry!');
  };

  const testPerformance = () => {
    const transaction = Sentry.startTransaction({
      name: 'test-performance',
      op: 'user-interaction'
    });
    
    // Simulate some work
    setTimeout(() => {
      transaction.finish();
      alert('Performance transaction completed!');
    }, 1000);
  };

  return (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 space-y-2">
      <h3 className="font-semibold text-destructive flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Sentry Testing (Remove in Production)
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={testError} 
          variant="destructive" 
          size="sm"
        >
          Test Uncaught Error
        </Button>
        <Button 
          onClick={testCaptureException} 
          variant="outline" 
          size="sm"
        >
          Test Caught Error
        </Button>
        <Button 
          onClick={testCaptureMessage} 
          variant="outline" 
          size="sm"
        >
          Test Message
        </Button>
        <Button 
          onClick={testPerformance} 
          variant="outline" 
          size="sm"
        >
          Test Performance
        </Button>
      </div>
    </div>
  );
};

export default SentryTestButton;