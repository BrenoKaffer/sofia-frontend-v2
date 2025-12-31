'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a simple test page to verify the application is working.</p>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Features Implemented:</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Real-time monitoring dashboard</li>
              <li>Bet validation system</li>
              <li>Error recovery system</li>
              <li>Betting automation integration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}