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
  const [currentStepId, setCurrentStepId] = useState<string>(steps[0]?.id);
  const [currentSubStepIndex, setCurrentSubStepIndex] = useState(0);
  const [simulationHistory, setSimulationHistory] = useState<Array<{
    stepId: string;
    subStepIndex: number;
    result: 'success' | 'failure';
  }>>([]);

  const currentStep = steps.find(s => s.id === currentStepId);
  const currentSubStep = currentStep?.subSteps[currentSubStepIndex];

  const handleResult = (result: 'success' | 'failure') => {
    if (!currentStep || !currentSubStep) return;

    // Record in history
    setSimulationHistory(prev => [...prev, {
      stepId: currentStep.id,
      subStepIndex: currentSubStepIndex,
      result
    }]);

    // Handle sub-step navigation
    if (result === 'success') {
      if (currentSubStep.successAction === 'next') {
        // Move to next sub-step
        if (currentSubStepIndex < currentStep.subSteps.length - 1) {
          setCurrentSubStepIndex(prev => prev + 1);
        } else if (currentStep.successStepId) {
          // Move to next step
          setCurrentStepId(currentStep.successStepId);
          setCurrentSubStepIndex(0);
        }
      } else if (currentSubStep.successAction === 'goto' && currentSubStep.successStepId) {
        setCurrentStepId(currentSubStep.successStepId);
        setCurrentSubStepIndex(0);
      }
    } else {
      if (currentSubStep.failureAction === 'next') {
        if (currentSubStepIndex < currentStep.subSteps.length - 1) {
          setCurrentSubStepIndex(prev => prev + 1);
        } else if (currentStep.failureStepId) {
          setCurrentStepId(currentStep.failureStepId);
          setCurrentSubStepIndex(0);
        }
      } else if (currentSubStep.failureAction === 'goto' && currentSubStep.failureStepId) {
        setCurrentStepId(currentSubStep.failureStepId);
        setCurrentSubStepIndex(0);
      }
    }
  };

  const renderFlowDiagram = () => {
    if (simulationHistory.length === 0) return null;

    // Flatten the history into a single sequence
    const flatHistory = simulationHistory.map((record, index) => {
      const step = steps.find(s => s.id === record.stepId);
      return {
        ...record,
        stepTitle: step?.title || '',
        isLastInStep: index < simulationHistory.length - 1 && 
          simulationHistory[index + 1].stepId !== record.stepId
      };
    });

    return (
      <div className="relative w-full h-[200px] mt-4 overflow-auto">
        <div className="absolute inset-0 p-4">
          <div className="flex items-center space-x-4">
            <AnimatePresence>
              {flatHistory.map((record, index) => (
                <React.Fragment key={index}>
                  {/* Node */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    {/* Step title (only show for first sub-step of each step) */}
                    {index === 0 || flatHistory[index - 1].stepId !== record.stepId ? (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`w-40 p-2 mb-2 text-center ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        } rounded-lg shadow-lg border-2 border-blue-500`}
                      >
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {record.stepTitle}
                        </span>
                      </motion.div>
                    ) : null}

                    {/* Sub-step */}
                    <motion.div
                      className={`w-40 p-3 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      } rounded-lg shadow border-2 ${
                        record.result === 'success' 
                          ? 'border-green-500' 
                          : 'border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                          Sub-step {record.subStepIndex + 1}
                        </span>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.2 + 0.3 }}
                        >
                          {record.result === 'success' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Arrow to next node */}
                  {index < flatHistory.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: index * 0.2 + 0.2, duration: 0.3 }}
                      className="flex items-center"
                    >
                      <div className={`w-8 h-0.5 ${
                        record.result === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div className={`w-0 h-0 border-t-[6px] border-t-transparent 
                        border-b-[6px] border-b-transparent border-l-[8px] ${
                        record.result === 'success' 
                          ? 'border-l-green-500' 
                          : 'border-l-red-500'
                      }`} />
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      {/* Header */}
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

      {/* Current Step Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <div className="flex items-center gap-4 mb-4">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {currentStep?.title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm ${
            currentStep?.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : currentStep?.type === 'failure'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {currentStep?.type}
          </span>
        </div>

        {currentSubStep && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4" />
              <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Sub-step {currentSubStepIndex + 1} of {currentStep?.subSteps.length}
              </span>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentSubStep.content}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleResult('success')}
                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Success
              </button>
              <button
                onClick={() => handleResult('failure')}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Failure
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Flow Diagram */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Flow Progress
        </h4>
        {renderFlowDiagram()}
      </motion.div>
    </div>
  );
};

export default FlowSimulation; 