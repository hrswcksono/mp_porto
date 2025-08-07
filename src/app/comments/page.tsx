'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, taskApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  MessageSquareIcon, 
  SendIcon,
  ReplyIcon,
  HeartIcon,
  MoreVerticalIcon,
  FilterIcon,
  SearchIcon,
  UserIcon
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Project, Task } from '@/types';

interface Comment {
  id: number;
  content: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  commentable_type: string;
  commentable_id: number;
  parent_id?: number;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export default function CommentsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', selectedProject],
    queryFn: () => taskApi.getTasks({ project_id: selectedProject || undefined }),
    enabled: !!selectedProject,
  });

  const comments: Comment[] = [
    {
      id: 1,
      content: 'Progres proyek sudah mencapai 75%. Tim development sudah menyelesaikan sebagian besar fitur utama.',
      user: { id: 1, name: 'Ahmad Rizki' },
      commentable_type: 'project',
      commentable_id: 1,
      likes_count: 5,
      is_liked: false,
      created_at: '2025-08-07T10:30:00Z',
      updated_at: '2025-08-07T10:30:00Z',
      replies: [
        {
          id: 2,
          content: 'Bagus! Kapan estimasi selesai untuk fitur yang tersisa?',
          user: { id: 2, name: 'Sari Dewi' },
          commentable_type: 'project',
          commentable_id: 1,
          parent_id: 1,
          likes_count: 2,
          is_liked: true,
          created_at: '2025-08-07T11:00:00Z',
          updated_at: '2025-08-07T11:00:00Z',
        }
      ]
    },
    {
      id: 3,
      content: 'Ada kendala di bagian integrasi API. Perlu diskusi dengan tim backend.',
      user: { id: 3, name: 'Budi Santoso' },
      commentable_type: 'task',
      commentable_id: 1,
      likes_count: 1,
      is_liked: false,
      created_at: '2025-08-07T09:15:00Z',
      updated_at: '2025-08-07T09:15:00Z',
    }
  ];

  const filteredComments = comments.filter(comment => {
    if (selectedProject && comment.commentable_type === 'project' && comment.commentable_id !== parseInt(selectedProject)) {
      return false;
    }
    if (selectedTask && comment.commentable_type === 'task' && comment.commentable_id !== parseInt(selectedTask)) {
      return false;
    }
    if (searchQuery && !comment.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    console.log('Submitting comment:', newComment);
    setNewComment('');
  };

  const handleSubmitReply = (commentId: number) => {
    if (!replyContent.trim()) return;
    console.log('Submitting reply to comment', commentId, ':', replyContent);
    setReplyContent('');
    setReplyTo(null);
  };

  const handleLikeComment = (commentId: number) => {
    console.log('Toggling like for comment:', commentId);
  };

  const getCommentableTitle = (comment: Comment) => {
    if (comment.commentable_type === 'project') {
      const project = projects?.data?.data?.find((p: Project) => p.id === comment.commentable_id);
      return project ? `Proyek: ${project.name}` : 'Proyek';
    } else if (comment.commentable_type === 'task') {
      const task = tasks?.data?.data?.find((t: Task) => t.id === comment.commentable_id);
      return task ? `Tugas: ${task.title}` : 'Tugas';
    }
    return 'Diskusi';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diskusi</h1>
            <p className="text-gray-600">Komentar dan diskusi proyek</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Cari diskusi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedTask('');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Proyek</option>
                  {projects?.data?.data?.map((project: Project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                {selectedProject && (
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Tugas</option>
                    {tasks?.data?.data?.map((task: Task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tulis komentar..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <SendIcon className="h-4 w-4 mr-2" />
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada diskusi</p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {comment.user.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {getCommentableTitle(comment)} • {formatRelativeTime(comment.created_at)}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-sm ${
                            comment.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                          }`}
                        >
                          <HeartIcon className={`h-4 w-4 ${comment.is_liked ? 'fill-current' : ''}`} />
                          <span>{comment.likes_count}</span>
                        </button>
                        
                        <button
                          onClick={() => setReplyTo(comment.id)}
                          className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
                        >
                          <ReplyIcon className="h-4 w-4" />
                          <span>Balas</span>
                        </button>
                      </div>

                      {replyTo === comment.id && (
                        <div className="mt-4 flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Tulis balasan..."
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                            />
                            <div className="mt-2 flex justify-end space-x-2">
                              <button
                                onClick={() => setReplyTo(null)}
                                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim()}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                Balas
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-4 w-4 text-gray-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {reply.user.name}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {formatRelativeTime(reply.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleLikeComment(reply.id)}
                                    className={`flex items-center space-x-1 text-xs ${
                                      reply.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                    }`}
                                  >
                                    <HeartIcon className={`h-3 w-3 ${reply.is_liked ? 'fill-current' : ''}`} />
                                    <span>{reply.likes_count}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
