import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { studentAPI } from "../../api";

export default function StudentDetails() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["student-details", id],
    queryFn: () =>
      studentAPI.getById(id).then(res => res.data.data)
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const student = data;
  const hasDocuments =
  student?.resumeUrl ||
  student?.githubUrl ||
  student?.linkedinUrl ||
  student?.portfolioUrl;
  

  return (
    <div className="space-y-6">
      <div className="card p-6">

        <h1 className="text-2xl font-bold">
          {student.firstName} {student.lastName}
        </h1>

        <p>Branch: {student.branch}</p>
        <p>CGPA: {student.cgpa}</p>

        <p>Email: {student.user?.email}</p>

<hr className="my-4" />

<h2 className="font-semibold mb-3">
  Documents & Links
</h2>

{!hasDocuments ? (
  <div className="p-4 border rounded-lg bg-gray-50 text-gray-500 text-sm">
    No documents or links uploaded yet.
  </div>
) : (
  <div className="flex flex-wrap gap-3">

    {student.resumeUrl && (
      <a
        href={`http://localhost:5000${student.resumeUrl}`}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
      >
        📄 Resume
      </a>
    )}

    {student.githubUrl && (
      <a
        href={student.githubUrl}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
      >
        🔗 GitHub

      </a>
    )}

    {student.linkedinUrl && (
      <a
        href={student.linkedinUrl}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
      >
        💼 LinkedIn
      </a>
    )}

    {student.portfolioUrl && (
      <a
        href={student.portfolioUrl}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
      >
         🌐 Portfolio

      </a>
    )}

  </div>
)}

<hr className="my-4" />

        <h2 className="font-semibold mb-2">
          Skills
        </h2>

        <div className="flex flex-wrap gap-2">
          {student.skills?.map(skill => (
            <span
              key={skill}
              className=" px-3 py-1 rounded-full text-sm font-medium
      border
      bg-blue-50 text-blue-700 border-blue-200
      dark:bg-slate-800 dark:text-cyan-300 dark:border-slate-600
    "
            >
              {skill}
            </span>
          ))}
        </div>

        <hr className="my-4" />

        <h2 className="font-semibold mb-2">
          Projects
        </h2>

        {student.projects?.map((project, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 mb-3"
          >
            <h3 className="font-semibold">
              {project.title}
            </h3>

            <p>
              {project.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}