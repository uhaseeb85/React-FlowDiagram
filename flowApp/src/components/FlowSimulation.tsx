import React, { useState } from 'react';
import { X, Check, XCircle, ArrowRight } from 'lucide-react';
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
      <div className={`mb-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
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
      </div>

      {/* Simulation History */}
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Simulation History
        </h4>
        <div className="space-y-2">
          {simulationHistory.map((record, index) => {
            const step = steps.find(s => s.id === record.stepId);
            return (
              <div 
                key={index}
                className={`flex items-center gap-3 p-2 rounded ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <span className={record.result === 'success' ? 'text-green-500' : 'text-red-500'}>
                  {record.result === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                  {step?.title} - Sub-step {record.subStepIndex + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FlowSimulation; 