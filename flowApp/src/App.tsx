import React, { useState } from 'react';
import { PlusCircle, X, ChevronDown, ChevronUp, ArrowRight, ArrowDown } from 'lucide-react';

// Types
type StepType = 'normal' | 'success' | 'failure';

interface SubStep {
  id: string;
  content: string;
}

interface Step {
  id: string;
  title: string;
  type: StepType;
  subSteps: SubStep[];
  expanded: boolean;
  successStepId?: string;
  failureStepId?: string;
}

// Main Component
const FlowDiagramBuilder = () => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addStep = (type: StepType = 'normal') => {
    if (!newStepTitle.trim()) return;

    const newStep: Step = {
      id: generateId(),
      title: newStepTitle,
      type,
      subSteps: [],
      expanded: true
    };

    setSteps([...steps, newStep]);
    setNewStepTitle('');
  };

  const addSubStep = (stepId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: [...step.subSteps, { id: generateId(), content: '' }]
        };
      }
      return step;
    }));
  };

  const updateSubStep = (stepId: string, subStepId: string, content: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: step.subSteps.map(subStep => 
            subStep.id === subStepId ? { ...subStep, content } : subStep
          )
        };
      }
      return step;
    }));
  };

  const toggleExpand = (stepId: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, expanded: !step.expanded } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const deleteSubStep = (stepId: string, subStepId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subSteps: step.subSteps.filter(subStep => subStep.id !== subStepId)
        };
      }
      return step;
    }));
  };

  const connectSuccessStep = (sourceId: string, targetId: string) => {
    setSteps(steps.map(step => 
      step.id === sourceId ? { ...step, successStepId: targetId } : step
    ));
  };

  const connectFailureStep = (sourceId: string, targetId: string) => {
    setSteps(steps.map(step => 
      step.id === sourceId ? { ...step, failureStepId: targetId } : step
    ));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Flow Diagram Builder</h1>
        <div className="flex gap-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <input
            type="text"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Enter step title"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 shadow-sm"
          />
          <button
            onClick={() => addStep('normal')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 font-semibold shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Add Step
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`bg-white shadow-lg rounded-2xl p-8 transition-all duration-200 hover:shadow-xl ${
              step.type === 'success'
                ? 'border-2 border-green-500/50 hover:border-green-500'
                : step.type === 'failure'
                ? 'border-2 border-red-500/50 hover:border-red-500'
                : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleExpand(step.id)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  {step.expanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <h3 className="text-2xl font-bold text-gray-800">{step.title}</h3>
              </div>
              <div className="flex items-center gap-4">
                <select
                  onChange={(e) => connectSuccessStep(step.id, e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white shadow-sm hover:border-green-500 transition-colors duration-200"
                  value={step.successStepId || ''}
                >
                  <option value="">Connect Success →</option>
                  {steps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <select
                  onChange={(e) => connectFailureStep(step.id, e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white shadow-sm hover:border-red-500 transition-colors duration-200"
                  value={step.failureStepId || ''}
                >
                  <option value="">Connect Failure →</option>
                  {steps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => deleteStep(step.id)}
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {step.expanded && (
              <div className="pl-12 space-y-4">
                {step.subSteps.map((subStep) => (
                  <div key={subStep.id} className="flex items-center gap-4">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={subStep.content}
                      onChange={(e) =>
                        updateSubStep(step.id, subStep.id, e.target.value)
                      }
                      placeholder="Enter sub-step details"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                    />
                    <button
                      onClick={() => deleteSubStep(step.id, subStep.id)}
                      className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSubStep(step.id)}
                  className="mt-4 px-5 py-2.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Sub-step
                </button>
              </div>
            )}

            {(step.successStepId || step.failureStepId) && (
              <div className="mt-8 pl-12 space-y-3 border-t pt-6 border-gray-100">
                {step.successStepId && (
                  <div className="flex items-center gap-3 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-semibold">Success → {steps.find(s => s.id === step.successStepId)?.title}</span>
                  </div>
                )}
                {step.failureStepId && (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-semibold">Failure → {steps.find(s => s.id === step.failureStepId)?.title}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowDiagramBuilder;