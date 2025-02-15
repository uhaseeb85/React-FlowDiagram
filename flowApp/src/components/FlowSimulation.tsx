import React, { useState } from 'react';
import { X, Check, XCircle, ArrowRight } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  type: 'normal' | 'success' | 'failure' | 'decision';
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
  const [activeStep, setActiveStep] = useState(steps[0]);
  const [activeSubStepIndex, setActiveSubStepIndex] = useState(0);
  const [flowPath, setFlowPath] = useState<Array<{
    step: Step;
    subStepIndex: number;
    result: 'success' | 'failure';
  }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleChoice = (result: 'success' | 'failure') => {
    if (!activeStep) return;

    const currentSubStep = activeStep.subSteps[activeSubStepIndex];
    if (!currentSubStep) return;

    // Add current step to path
    setFlowPath(prev => [...prev, {
      step: activeStep,
      subStepIndex: activeSubStepIndex,
      result
    }]);

    // Determine next step
    let nextStepId: string | undefined;
    if (result === 'success') {
      if (currentSubStep.successAction === 'next') {
        if (activeSubStepIndex < activeStep.subSteps.length - 1) {
          setActiveSubStepIndex(activeSubStepIndex + 1);
          return;
        }
        nextStepId = activeStep.successStepId;
      } else {
        nextStepId = currentSubStep.successStepId;
      }
    } else {
      if (currentSubStep.failureAction === 'next') {
        nextStepId = activeStep.failureStepId;
      } else {
        nextStepId = currentSubStep.failureStepId;
      }
    }

    if (nextStepId) {
      const nextStep = steps.find(s => s.id === nextStepId);
      if (nextStep) {
        // Check if next step has sub-steps
        if (nextStep.subSteps.length === 0) {
          setIsComplete(true);
          setFlowPath(prev => [...prev, {
            step: nextStep,
            subStepIndex: 0,
            result: 'success'
          }]);
        } else {
          setActiveStep(nextStep);
          setActiveSubStepIndex(0);
        }
      }
    } else {
      // No next step means we've reached the end
      setIsComplete(true);
    }
  };

  const renderFlowDiagram = () => {
    return (
      <div className="relative min-h-[300px] p-8 overflow-x-auto">
        <div className="flex items-start gap-4 min-w-max">
          <AnimatePresence mode="popLayout">
            {flowPath.map((node, index) => (
              <motion.div
                key={`${node.step.id}-${node.subStepIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex flex-col items-center"
              >
                {/* Step Node */}
                <div className={`w-64 p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg border-2 ${
                  node.result === 'success' 
                    ? 'border-green-500' 
                    : 'border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {node.step.title}
                    </span>
                    {node.result === 'success' 
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  {node.step.subSteps[node.subStepIndex] && (
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Sub-step {node.subStepIndex + 1}: {node.step.subSteps[node.subStepIndex].content}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {index < flowPath.length - 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center mx-4 h-8"
                  >
                    <div className={`w-12 h-0.5 ${
                      node.result === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className={`w-0 h-0 border-t-[6px] border-t-transparent 
                      border-b-[6px] border-b-transparent border-l-[8px] ${
                      node.result === 'success' 
                        ? 'border-l-green-500' 
                        : 'border-l-red-500'
                    }`} />
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Active Step (only show if not complete) */}
            {!isComplete && (
              <motion.div
                key="active-step"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center"
              >
                <div className={`w-64 p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg border-2 border-blue-500`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {activeStep.title}
                    </span>
                  </div>
                  <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Sub-step {activeSubStepIndex + 1}: {activeStep.subSteps[activeSubStepIndex]?.content}
                  </div>
                  
                  {/* Choice Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleChoice('success')}
                      className="px-4 py-2 rounded-lg bg-green-500 text-white 
                        hover:bg-green-600 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Success
                    </button>
                    <button
                      onClick={() => handleChoice('failure')}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white 
                        hover:bg-red-600 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Failure
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Completion Message */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                } shadow-lg border-2 border-blue-500`}
              >
                <h3 className="text-lg font-medium mb-2">Flow Complete!</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  The simulation has reached its end.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6 overflow-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Flow Simulation
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {renderFlowDiagram()}
    </div>
  );
};

export default FlowSimulation; 