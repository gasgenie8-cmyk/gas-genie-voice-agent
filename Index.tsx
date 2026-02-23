import { useCallback } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import CTASection from "@/components/landing/CTASection";
import FloatingMic from "@/components/landing/FloatingMic";
import Footer from "@/components/landing/Footer";
import { useToast } from "@/hooks/use-toast";
import { useVapiVoice } from "@/hooks/useVapiVoice";

const VAPI_ASSISTANT_ID = "93b5e93e-2ca2-408c-8797-d232c15efe1c";

const Index = () => {
  const { toast } = useToast();

  const {
    status: vapiStatus,
    toggleCall,
    isActive,
  } = useVapiVoice({
    assistantId: VAPI_ASSISTANT_ID,
    onTranscript: (text, isFinal) => {
      console.log("Transcript:", text, "Final:", isFinal);
    },
    onCallEnd: () => {
      toast({
        title: "Call Ended",
        description: "Voice session completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = useCallback(async () => {
    try {
      await toggleCall();
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    }
  }, [toggleCall, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onTalkClick={handleToggle} isActive={isActive} />
      <WorkflowSection />
      <CTASection />
      <Footer />
      <FloatingMic onClick={handleToggle} isActive={isActive} />
    </div>
  );
};

export default Index;
