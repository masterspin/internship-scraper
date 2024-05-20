"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import Form from '@/components/modal';
import EditForm from '@/components/editModal';
import DeleteForm from '@/components/deleteModal';
import useSharedFormState from '@/app/hook/useCustomJobPosts';

import { supabaseBrowser } from '@/lib/supabase/browser';
import useUser from '@/app/hook/useUser';
import { FaFile, FaGithub, FaLinkedin } from 'react-icons/fa';

const supabase = supabaseBrowser();

export default function Home() {

  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const {customJobPosts, setCustomJobPosts} = useSharedFormState();
  const [filteredJobPosts, setFilteredJobPosts] = useState<any[]>([]);
  const [hasStatus, setHasStatus] = useState(false);
  const [selectedButton, setSelectedButton] = useState(0);

  const { isFetching, data } = useUser();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: jobData, error } = await supabase.from('posts').select('*');
        if (error) {
          throw error;
        }
        
        setHasStatus(false);

        const statusPromises = jobData.map(async (jobPost) => {
        try {
            const link = jobPost.job_link;
            const id = data?.id;
            const { data: statusData, error } = await supabase.from('statuses').upsert({ user: id, job: link }).select().single();
            return { ...jobPost, status: statusData?.status };
          } catch (error:any) {
            console.error('Error fetching job status:', error.message);
            return { ...jobPost, status: 'Unknown' }; 
          }
        });

        const newJobPosts = await Promise.all(statusPromises);

        setJobPosts(newJobPosts);

        
        if(data){
          try {
            const { data: customApplications, error } = await supabase
                .from('custom_applications')
                .select('*')
                .eq('user', data.id);
    
            if (error) {
                throw error;
            }
    
            setCustomJobPosts(customApplications);
          } catch (error:any) {
            console.error('Error fetching custom applications:', error.message);
          }
        }


        setHasStatus(true);
      } catch (error:any) {
        console.error('Error fetching job posts:', error.message);
      }
    };
    fetchData();
  }, [data]);

//NEED TO DO 'thiS
const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, jobId: string) => {
  const newStatus = e.target.value;

  console.log(newStatus);
  // Update the jobPosts state with the new status for the job post with the matching ID
  setJobPosts(jobPosts.map(jobPost => {
      if (jobPost.job_link === jobId) {
        jobPost.status = newStatus;
      }
      return jobPost;
  }));

  setCustomJobPosts(customJobPosts.map(jobPost => {
    if (jobPost.job_link === jobId) {
      jobPost.status = newStatus;
    }
    return jobPost;
  }));

  if (data && selectedButton !== 4) {
      try {
          const { data: updateData, error } = await supabase
              .from('statuses')
              .upsert({ user: data.id, job: jobId, status: newStatus })
              .select('*');
          if (error) {
              throw error;
          }
      } catch (error:any) {
          console.error('Error updating job status:', error.message);
      }
  }

  if(data && selectedButton === 4){
    try {
      const { data: updateData, error } = await supabase
          .from('custom_applications')
          .upsert({ user: data.id, job_link: jobId, status: newStatus })
          .select('*');
      if (error) {
          throw error;
      }
      } catch (error:any) {
          console.error('Error updating job status:', error.message);
      }
  }

};

const handleSourceClick = (index: number) => {
  console.log("called");
  setSelectedButton(index);
  setHasStatus(false);
  let filteredData = [];
  if (jobPosts) {
    const currentYear = new Date().getFullYear();
    switch (index) {
      case 0:
        filteredData = jobPosts.filter(jobPost => jobPost.source === 'LinkedIn' && jobPost.job_type === 'SWE').sort((a, b) => {
          const dateA:any = new Date(a.date);
          const dateB:any = new Date(b.date);
          return dateB - dateA;
        });
        break;
      case 1:
        filteredData = jobPosts.filter(jobPost => jobPost.source === 'PittCSC').sort((a, b) => {
          const dateA:any = new Date(`${a.date} ${currentYear}`);
          const dateB:any = new Date(`${b.date} ${currentYear}`);
          return dateB - dateA;
      });
        break;
      case 2:
        filteredData = jobPosts.filter(jobPost => jobPost.source === 'Ouckah').sort((a, b) => {
          const dateA:any = new Date(`${a.date} ${currentYear}`);
          const dateB:any = new Date(`${b.date} ${currentYear}`);
          return dateB - dateA;
      });
        break;
      case 3:
        filteredData = jobPosts.filter(jobPost => jobPost.source === 'PittCSC Off-Season').sort((a, b) => {
          const dateA:any = new Date(`${a.date} ${currentYear}`);
          const dateB:any = new Date(`${b.date} ${currentYear}`);
          return dateB - dateA;
      });
        break;
      case 4:
        filteredData = customJobPosts;
        break;
      case 5:
        filteredData = jobPosts.filter(jobPost => jobPost.source === 'LinkedIn' && jobPost.job_type === 'QUANT').sort((a, b) => {
          const dateA:any = new Date(a.date);
          const dateB:any = new Date(b.date);
          return dateB - dateA;
        });
        break;
      case 6:
        filteredData = jobPosts.filter(jobPost => jobPost.source === 'LinkedIn' && jobPost.job_type === 'BUS').sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
        break;
      default:
        filteredData = [...jobPosts];
        break;
    }
    setFilteredJobPosts(filteredData);
    setHasStatus(true);
    console.log(filteredData);
  }
};

useEffect(() => {
  handleSourceClick(selectedButton);
}, [jobPosts, customJobPosts]);


  if(isFetching){
    return <></>
  }

  return (
    <div>
      <Header />
      {hasStatus && (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex flex-col md:flex-row justify-start space-y-4 md:space-y-0 md:space-x-4">
            <button
              onClick={() => handleSourceClick(0)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-blue-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 0 ? 'bg-blue-600 hover:bg-blue-600' : 'hover:bg-blue-600'
              }`}
            >
              <FaLinkedin size={16} />
              <span>SWE</span>
            </button>
            <button
              onClick={() => handleSourceClick(5)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-blue-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 5 ? 'bg-blue-600 hover:bg-blue-600' : 'hover:bg-blue-600'
              }`}
            >
              <FaLinkedin size={16} />
              <span>QUANT</span>
            </button>
            <button
              onClick={() => handleSourceClick(6)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-blue-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 6 ? 'bg-blue-600 hover:bg-blue-600' : 'hover:bg-blue-600'
              }`}
            >
              <FaLinkedin size={16} />
              <span>BUS</span>
            </button>
            <button
              onClick={() => handleSourceClick(1)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-green-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 1 ? 'bg-green-600 hover:bg-green-600' : 'hover:bg-green-600'
              }`}
            >
              <FaGithub size={16} />
              <span>PittCSC</span>
            </button>
            <button
              onClick={() => handleSourceClick(2)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-green-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 2 ? 'bg-green-600 hover:bg-green-600' : 'hover:bg-green-600'
              }`}
            >
              <FaGithub size={16} />
              <span>Ouckah</span>
            </button>
            <button
              onClick={() => handleSourceClick(3)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-green-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 3 ? 'bg-green-600 hover:bg-green-600' : 'hover:bg-green-600'
              }`}
            >
              <FaGithub size={16} />
              <span>PittCSC Off-Season</span>
            </button>
            {data && (<button
              onClick={() => handleSourceClick(4)}
              className={`text-sm w-full md:w-auto px-2 py-2 border border-solid border-red-600 font-semibold text-gray-300 rounded-lg shadow-md flex items-center justify-center space-x-2 ${
                selectedButton === 4 ? 'bg-red-600 hover:bg-red-600' : 'hover:bg-red-600'
              }`}
            >
              <FaFile size={16} />
              <span>Personal Applications</span>
            </button>
          )}
          </div>
          {data && selectedButton === 4 &&
            (<Form />)
          }
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {data && selectedButton === 4 && (<th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"></th>)}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Location</th>
                {selectedButton == 3 && (<th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Term</th>)}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                {data && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredJobPosts.map((filteredJobPosts:any) => (
                <tr key={filteredJobPosts.id} className="border-b border-gray-200 dark:border-gray-700">
                  {data && selectedButton === 4 && (
                    <div className="flex space-x-4">
                      <DeleteForm jobPost={filteredJobPosts} />
                      <EditForm jobPost={filteredJobPosts} />
                    </div>                  
                  )}
                  <td className="px-4 py-3 text-sm font-medium">
                    <Link
                      href={filteredJobPosts.job_link}
                      target="_blank"
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {filteredJobPosts.job_role}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{filteredJobPosts.company_name}</td>
                  <td className="px-4 py-3 text-sm">{filteredJobPosts.location}</td>
                  {selectedButton == 3 && (<td className="px-4 py-3 text-sm">{filteredJobPosts.term}</td>)}
                  <td className="px-4 py-3 text-sm">{filteredJobPosts.date}</td>
                  {data && (
                    <td className="px-4 py-3 text-sm">
                      <select className={`bg-transparent border border-gray-300 rounded-md py-2 outline-none
                          ${filteredJobPosts.status === 'Not Applied' ? 'text-gray-600' : ''}
                          ${filteredJobPosts.status === 'Applied' ? 'text-white-600' : ''}
                          ${filteredJobPosts.status === 'OA Received' ? 'text-white-600' : ''}
                          ${filteredJobPosts.status === 'Interview Scheduled' ? 'text-blue-600' : ''}
                          ${filteredJobPosts.status === 'Waitlisted' ? 'text-yellow-600' : ''}
                          ${filteredJobPosts.status === 'Rejected' ? 'text-red-600' : ''}
                          ${filteredJobPosts.status === 'Offer Received' ? 'text-green-600' : ''}
                          ${filteredJobPosts.status === 'Accepted' ? 'text-green-300' : ''}`}

                        value={filteredJobPosts.status}
                        onChange={(e) => handleStatusChange(e, filteredJobPosts.job_link)}>
                        <option value="Not Applied">Not Applied</option>
                        <option value="Applied">Applied</option>
                        <option value="OA Recieved">OA Received</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Offer Received">Offer Received</option>
                        <option value="Accepted">Accepted</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {!hasStatus && (
        <div>
          <div className="flex justify-center items-center h-32">
            <h1 className="text-blue-500 text-3xl font-bold">Loading...</h1>
          </div>
          <div className="flex justify-center items-center">
            <p className="text-gray-300">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
