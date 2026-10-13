import { CheckCircle2, Clock, Truck } from 'lucide-react';

interface ServiceTrackerProps {
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  scheduledTime: string;
}

export default function ServiceTracker({ status, scheduledDate, scheduledTime }: ServiceTrackerProps) {
  const normalizedStatus = status || 'scheduled';

  const steps = [
    {
      id: 'scheduled',
      title: 'Scheduled',
      description: `${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}`,
      icon: Clock,
      isCompleted: ['scheduled', 'assigned', 'in_progress', 'completed'].includes(normalizedStatus)
    },
    {
      id: 'assigned',
      title: 'Assigned / In Progress',
      description: 'Service provider assigned and work started',
      icon: Truck,
      isCompleted: ['assigned', 'in_progress', 'completed'].includes(normalizedStatus)
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Service has been completed',
      icon: CheckCircle2,
      isCompleted: ['completed'].includes(normalizedStatus)
    }
  ];

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {steps.map((step) => (
        <div key={step.id} className="relative flex items-center">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
            step.isCompleted 
              ? 'border-primary bg-primary text-white' 
              : 'border-slate-300 bg-slate-50'
          }`}>
            <step.icon className="h-5 w-5" />
          </div>
          <div className="ml-4 pb-8">
            <div className="font-medium">{step.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}