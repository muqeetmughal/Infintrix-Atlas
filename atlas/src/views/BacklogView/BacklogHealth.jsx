import { Spin } from 'antd';
import { useFrappeGetCall } from 'frappe-react-sdk';

const BacklogHealth = ({
    project_id
}) => {
      const metrics_query = useFrappeGetCall(
        "infintrix_atlas.api.v1.get_project_flow_metrics",
        { project: project_id }
      );
  return (
    <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit px-8 py-4 bg-slate-900 rounded-[40px] text-white flex items-center justify-between shadow-2xl">
          {metrics_query.isLoading ? (
            <Spin  />
          ) : (
            <>
              <div className="flex items-center gap-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                    Efficiency
                                </span>
                                <span className="text-2xl font-black tracking-tighter">
                                    {metrics_query?.data?.message?.efficiency}%
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                    Backlog Health
                                </span>
                                <span className={`text-2xl font-black tracking-tighter text-${metrics_query?.data?.message?.color}-500`}>
                                    {metrics_query?.data?.message?.health}
                                </span>
                                {metrics_query?.data?.message?.message && (
                                    <span className="text-[10px] text-slate-400 mt-2">
                                        💡 {metrics_query?.data?.message?.message}
                                    </span>
                                )}
                            </div>
                        </div>
              {/* <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400"
                    >
                      U{i}
                    </div>
                  ))}
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 transition-all">
                  Open Details
                </button>
              </div> */}
            </>
          )}
        </footer>
  )
}

export default BacklogHealth