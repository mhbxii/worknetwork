import { CandidateProfile, MetaOption, Proposal, User } from '@/types/entities';
import { useCallback, useEffect, useState } from 'react';

interface UseJobProposalsReturn {
  proposals: Proposal[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchProposals: () => void;
  fetchMoreProposals: () => void;
  refreshProposals: () => void;
}

export function useJobProposals(jobId: number): UseJobProposalsReturn {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Mock data generator - replace with actual Supabase query
  const generateMockProposals = useCallback((startId: number, count: number): Proposal[] => {
    const mockStatuses: MetaOption[] = [
      { id: 1, name: 'pending' },
      { id: 2, name: 'interview' },
      { id: 3, name: 'accepted' },
      { id: 4, name: 'rejected' }
    ];

    const mockCompanies: MetaOption[] = [
      { id: 1, name: 'Tech Corp' },
      { id: 2, name: 'StartupX' }
    ];

    const mockCategories: MetaOption[] = [
      { id: 1, name: 'Frontend Development' },
      { id: 2, name: 'Backend Development' }
    ];

    const mockSkills: MetaOption[] = [
      { id: 1, name: 'React' },
      { id: 2, name: 'TypeScript' },
      { id: 3, name: 'Node.js' }
    ];

    return Array.from({ length: count }, (_, index) => {
      const id = startId + index;
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
      
      const mockUser: User = {
        id: id + 1000,
        supabase_user_id: `mock-user-${id}`,
        name: `Candidate ${id}`,
        email: `candidate${id}@example.com`,
        profile_pic_url: undefined,
        role: { id: 1, name: 'candidate' },
        country: { id: 1, name: 'Tunisia' },
        created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockCandidate: CandidateProfile = {
        job_title: `${randomStatus.name === 'accepted' ? 'Senior' : 'Junior'} Developer`,
        experiences: [
          {
            company: mockCompanies[Math.floor(Math.random() * mockCompanies.length)],
            job_title: 'Software Developer',
            start_date: '2022-01-01',
            end_date: randomStatus.name === 'accepted' ? undefined : '2023-12-31',
          }
        ],
        projects: [
          {
            name: `Project ${id}`,
            description: 'A sample project demonstrating skills',
            start_date: '2023-01-01',
            end_date: '2023-06-01',
          }
        ],
        skills: mockSkills.slice(0, Math.floor(Math.random() * 3) + 1),
        job_category: mockCategories[Math.floor(Math.random() * mockCategories.length)],
        nb_proposals: Math.floor(Math.random() * 10) + 1,
      };

      return {
        id,
        user: mockUser,
        candidate: mockCandidate,
        job_id: jobId,
        status: randomStatus,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
        matched_score: Math.random() * 100,
      };
    });
  }, [jobId]);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual Supabase query
      /*
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          matched_score,
          status_id,
          created_at,
          updated_at,
          users!candidate_id (
            id,
            supabase_user_id,
            name,
            email,
            profile_pic_url,
            country:countries(id, name),
            role:roles(id, name)
          ),
          candidate_profiles!candidate_id (
            job_title,
            job_category:job_categories(id, name),
            nb_proposals,
            candidate_experiences (
              job_title,
              start_date,
              end_date,
              company:companies(id, name)
            ),
            candidate_projects (
              name,
              description,
              start_date,
              end_date
            ),
            candidate_skills (
              skill:skills(id, name)
            )
          ),
          status:application_statuses(id, name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .range(0, 9);
      */
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = generateMockProposals(1, 5);
      setProposals(mockData);
      setPage(1);
      setHasMore(mockData.length === 10); // If we got 10, there might be more
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  }, [jobId, generateMockProposals]);

  const fetchMoreProposals = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const startId = proposals.length + 1;
      const mockData = generateMockProposals(startId, 3);
      
      setProposals(prev => [...prev, ...mockData]);
      setPage(prev => prev + 1);
      setHasMore(mockData.length === 10); // If we got less than 10, no more data
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more proposals');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, proposals.length, generateMockProposals]);

  const refreshProposals = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchProposals();
  }, [fetchProposals]);

  // Initial fetch
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchProposals,
    fetchMoreProposals,
    refreshProposals,
  };
}