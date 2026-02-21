"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLLMConfigStore } from "@/stores/llmConfigStore";

export function LLMConfigPanel() {
  const { config, setConfig } = useLLMConfigStore();
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="llm-base-url">Request URL</Label>
        <Input
          id="llm-base-url"
          type="text"
          placeholder="https://api.openai.com/v1"
          value={config.baseUrl}
          onChange={(e) => setConfig({ baseUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          OpenAI: <code>https://api.openai.com/v1</code> &middot;
          Gemini: <code>https://generativelanguage.googleapis.com/v1beta/openai</code> &middot;
          Ollama: <code>http://localhost:11434/v1</code>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="llm-api-key">API Key</Label>
        <div className="relative">
          <Input
            id="llm-api-key"
            type={showKey ? "text" : "password"}
            placeholder="sk-..."
            value={config.apiKey}
            onChange={(e) => setConfig({ apiKey: e.target.value })}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="llm-model">Model Name</Label>
        <Input
          id="llm-model"
          type="text"
          placeholder="gpt-4o"
          value={config.modelName}
          onChange={(e) => setConfig({ modelName: e.target.value })}
        />
      </div>
    </div>
  );
}
