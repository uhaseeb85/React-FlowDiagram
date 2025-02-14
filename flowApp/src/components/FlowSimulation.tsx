import React, { useState } from 'react';
import { X, RotateCcw, Camera, Layout, Check, XCircle } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

interface SubStep {
  id: string;
  content: string;
  successAction: 'next' | 'goto';
  failureAction: 'next' | 'goto';
  successStepId?: string;
  failureStepId?: string;
}

interface Step {
  id: string;
  title: string;
  type: 'normal' | 'success' | 'failure';
  subSteps: SubStep[];
  expanded: boolean;
  successStepId?: string;
  failureStepId?: string;
}

interface FlowSimulationProps {
  steps: Step[];
  onClose: () => void;
}

const FlowSimulation: React.FC<FlowSimulationProps> = ({ steps, onClose }) => {
  const { isDarkMode } = useDarkMode();
  const [currentStepId, setCurrentStepId] = useState<string | null>(steps[0]?.id || null);
  const [currentSubStepIndex, setCurrentSubStepIndex] = useState<number>(0);
  const [visitedStepIds, setVisitedStepIds] = useState<string[]>([steps[0]?.id || '']);
  const [history, setHistory] = useState<Array<{ 
    stepId: string; 
    result: 'success' | 'failure';
    subStepResults?: Array<'success' | 'failure'>;
  }>>([]);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);

  // Add console logs for debugging
  console.log('Current Step ID:', currentStepId);
  console.log('Visited Step IDs:', visitedStepIds);
  console.log('Visible Steps:', steps.filter(step => visitedStepIds.includes(step.id)));

  const handleSubStepResult = (result: 'success' | 'failure') => {
    const currentStep = steps.find(s => s.id === currentStepId);
    if (!currentStep) return;

    const currentSubStep = currentStep.subSteps[currentSubStepIndex];

    // Update history with sub-step result
    setHistory(prev => {
      const stepHistory = prev.find(h => h.stepId === currentStepId);
      if (stepHistory) {
        return prev.map(h => 
          h.stepId === currentStepId 
            ? {
                ...h,
                subStepResults: [...(h.subStepResults || []), result]
              }
            : h
        );
      } else {
        return [...prev, { 
          stepId: currentStepId, 
          result: 'pending',
          subStepResults: [result]
        }];
      }
    });

    let nextStepId: string | undefined;
    if (result === 'failure') {
      nextStepId = currentSubStep.failureAction === 'goto' 
        ? currentSubStep.failureStepId 
        : currentStep.failureStepId;
      
      if (nextStepId) {
        setHistory(prev => prev.map(h => 
          h.stepId === currentStepId 
            ? { ...h, result: 'failure' }
            : h
        ));
        setCurrentStepId(nextStepId);
        setCurrentSubStepIndex(0);
        setVisitedStepIds(prev => [...prev, nextStepId!]);
      }
    } else {
      if (currentSubStep.successAction === 'goto' && currentSubStep.successStepId) {
        nextStepId = currentSubStep.successStepId;
        setHistory(prev => prev.map(h => 
          h.stepId === currentStepId 
            ? { ...h, result: 'success' }
            : h
        ));
        setCurrentStepId(nextStepId);
        setCurrentSubStepIndex(0);
        setVisitedStepIds(prev => [...prev, nextStepId!]);
      } else if (currentSubStepIndex < currentStep.subSteps.length - 1) {
        setCurrentSubStepIndex(prev => prev + 1);
      } else if (currentStep.successStepId) {
        nextStepId = currentStep.successStepId;
        setHistory(prev => prev.map(h => 
          h.stepId === currentStepId 
            ? { ...h, result: 'success' }
            : h
        ));
        setCurrentStepId(nextStepId);
        setCurrentSubStepIndex(0);
        setVisitedStepIds(prev => [...prev, nextStepId!]);
      }
    }
  };

  const resetSimulation = () => {
    setCurrentStepId(steps[0]?.id || null);
    setCurrentSubStepIndex(0);
    setVisitedStepIds([steps[0]?.id || '']);
    setHistory([]);
  };

  const exportImage = () => {
    // Implement image export functionality
    console.log('Export image');
  };

  // Filter steps to show only visited ones plus the current one
  const visibleSteps = steps.filter(step => visitedStepIds.includes(step.id));

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-gray-100'} text-${isDarkMode ? 'white' : 'gray-800'}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold">Flow Simulation</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsVerticalLayout(!isVerticalLayout)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Layout className="w-4 h-4" />
            {isVerticalLayout ? 'Horizontal Layout' : 'Vertical Layout'}
          </button>
          <button
            onClick={exportImage}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            Export Image
          </button>
          <button
            onClick={resetSimulation}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="p-8">
        <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} items-center gap-8`}>
          {visibleSteps.map((step, index) => {
            const isCurrentStep = step.id === currentStepId;
            const stepHistory = history.find(h => h.stepId === step.id);
            const isVisited = stepHistory !== undefined;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-4">
                  {/* Main Step */}
                  <div
                    className={`
                      w-48 h-16 rounded-[20px] flex items-center justify-center
                      transition-all duration-200 relative
                      ${isCurrentStep ? 'ring-2 ring-blue-500' : ''}
                      ${isVisited 
                        ? stepHistory?.result === 'success' 
                          ? 'bg-green-500' 
                          : stepHistory?.result === 'failure'
                            ? 'bg-red-500'
                            : 'bg-white text-gray-900'
                        : 'bg-white text-gray-900'
                      }
                    `}
                  >
                    <span className="font-semibold">{step.title}</span>
                  </div>

                  {/* Sub-steps */}
                  {isCurrentStep && step.subSteps.length > 0 && (
                    <div className="space-y-2 min-w-[300px]">
                      {step.subSteps.map((subStep, subIndex) => (
                        <div 
                          key={subStep.id}
                          className={`
                            w-full h-12 rounded-[16px] flex items-center justify-between px-4
                            ${currentSubStepIndex === subIndex 
                              ? isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                              : isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }
                            ${currentSubStepIndex > subIndex ? 'opacity-50' : ''}
                            border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}
                          `}
                        >
                          <span>{subStep.content}</span>
                          {currentSubStepIndex === subIndex && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubStepResult('success')}
                                className="p-2 bg-green-500 rounded-full hover:bg-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSubStepResult('failure')}
                                className="p-2 bg-red-500 rounded-full hover:bg-red-600"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {index < visibleSteps.length - 1 && (
                  <div className={`
                    ${isVerticalLayout ? 'h-8 w-px' : 'w-8 h-px'}
                    bg-gray-600
                  `} />
                )}
              </React.Fragment>
            );
          })}
          {currentStepId === null && history.length > 0 && (
            <div className="w-48 h-16 rounded-[20px] bg-gray-600 flex items-center justify-center">
              <span className="font-semibold">END</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowSimulation; 