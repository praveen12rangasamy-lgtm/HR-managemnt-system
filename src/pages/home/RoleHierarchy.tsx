import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { User, ChevronDown, ChevronRight, Briefcase, Calendar, Award } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar?: string;
  children?: Employee[];
}

const hierarchyData: Employee = {
  id: 'ADM-001',
  name: 'Praveen',
  role: 'Admin / CEO',
  experience: '12 Years',
  avatar: 'https://i.pravatar.cc/150?img=68',
  children: [
    {
      id: 'MGR-001',
      name: 'Sarah Connor',
      role: 'Operations Manager',
      experience: '8 Years',
      avatar: 'https://i.pravatar.cc/150?img=47',
      children: [
        { id: 'EMP-101', name: 'John Smith', role: 'Sr. Backend Dev', experience: '5 Years', avatar: 'https://i.pravatar.cc/150?img=33' },
        { id: 'EMP-102', name: 'Jane Doe', role: 'UX Designer', experience: '4 Years', avatar: 'https://i.pravatar.cc/150?img=32' },
        { id: 'EMP-103', name: 'Alex Rivera', role: 'Full Stack Dev', experience: '3 Years', avatar: 'https://i.pravatar.cc/150?img=11' },
      ]
    },
    {
      id: 'MGR-002',
      name: 'Michael Scott',
      role: 'Sales Director',
      experience: '15 Years',
      avatar: 'https://i.pravatar.cc/150?img=13',
      children: [
        { id: 'EMP-201', name: 'Jim Halpert', role: 'Sales Manager', experience: '7 Years', avatar: 'https://i.pravatar.cc/150?img=14' },
        { id: 'EMP-202', name: 'Dwight Schrute', role: 'Asst. Regional Mgr', experience: '10 Years', avatar: 'https://i.pravatar.cc/150?img=15' },
      ]
    }
  ]
};


// Wrapper for TreeNode that handles isSelected correctly per node
const TreeNodeWrapper = ({ node, selectedNode, onSelect }: { node: Employee, selectedNode: Employee | null, onSelect: (node: Employee) => void }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.id === node.id;

  return (
    <div className="flex flex-col items-center">
      <div 
        onClick={() => onSelect(node)}
        className={`relative z-10 cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center min-w-[180px] shadow-sm hover:shadow-md ${
          isSelected 
            ? 'bg-brand-navy border-brand-navy text-white scale-105 ring-4 ring-brand-navy/10' 
            : 'bg-white border-brand-navy/5 text-brand-navy hover:border-brand-teal/30'
        }`}
      >
        <div className={`w-12 h-12 rounded-full mb-2 border-2 ${isSelected ? 'border-white/50' : 'border-brand-teal/20'} overflow-hidden`}>
          <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <p className={`font-black text-sm uppercase tracking-wider ${isSelected ? 'text-white' : 'text-brand-navy'}`}>
            {node.name}
          </p>
          <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-brand-teal'}`}>
            {node.role}
          </p>
        </div>
        
        {hasChildren && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
              isSelected ? 'bg-brand-teal text-white border-white scale-110' : 'bg-brand-navy text-white border-white shadow-sm'
            }`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="relative pt-12 flex gap-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-brand-navy/10" />
          
          {node.children!.length > 1 && (
             <div className="absolute top-6 left-[90px] right-[90px] h-0.5 bg-brand-navy/10" />
          )}

          {node.children!.map((child) => (
            <div key={child.id} className="relative">
              <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-brand-navy/10" />
              <TreeNodeWrapper 
                node={child} 
                selectedNode={selectedNode}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RoleHierarchy = () => {
  const [selectedNode, setSelectedNode] = useState<Employee | null>(hierarchyData);

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-black text-brand-navy uppercase tracking-widest mb-2">Organization Structure</h3>
        <p className="text-gray-500 text-sm font-medium">Click on any member to view their professional profile</p>
      </div>

      <div className="overflow-x-auto pb-20 pt-10 min-h-[500px] flex justify-center">
        <div className="inline-block align-top">
          <TreeNodeWrapper 
            node={hierarchyData} 
            selectedNode={selectedNode}
            onSelect={setSelectedNode}
          />
        </div>
      </div>

      {/* Profile Detail Card */}
      {selectedNode && (
        <div className="animate-in slide-in-from-bottom duration-500 flex justify-center sticky bottom-8 z-30 px-4">
          <Card className="max-w-4xl w-full border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-xl border border-white/20">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="bg-brand-navy p-10 flex flex-col items-center justify-center md:w-1/3 text-white">
                  <div className="w-24 h-24 rounded-3xl border-4 border-brand-teal/30 overflow-hidden shadow-2xl mb-4 rotate-3">
                    <img src={selectedNode.avatar} alt={selectedNode.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight text-center">{selectedNode.name}</h4>
                  <Badge variant="blue" className="mt-2 bg-brand-teal/20 text-brand-teal border-none text-[10px] font-black uppercase tracking-widest">{selectedNode.role}</Badge>
                </div>
                
                <div className="p-10 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 bg-white/50">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <User size={12} className="text-brand-teal" /> Employee ID
                    </p>
                    <p className="text-lg font-bold text-brand-navy font-mono">{selectedNode.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <Award size={12} className="text-brand-teal" /> Experience
                    </p>
                    <p className="text-lg font-bold text-brand-navy">{selectedNode.experience}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <Briefcase size={12} className="text-brand-teal" /> Role & Rank
                    </p>
                    <p className="text-lg font-bold text-brand-navy">{selectedNode.role}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <Calendar size={12} className="text-brand-teal" /> Status
                    </p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <p className="text-lg font-bold text-brand-navy">Active Member</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RoleHierarchy;
