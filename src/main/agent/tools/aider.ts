import fs from 'fs/promises';
import path from 'path';

import { tool } from 'ai';
import { z } from 'zod';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';
import { QuestionData } from '@common/types';

import { Project } from '../../project';

import type { ToolSet } from 'ai';

export const createAiderToolset = (project: Project): ToolSet => {
  const getContextFilesTool = tool({
    description: 'Get all files currently in the context for Aider to read or edit',
    parameters: z.object({
      projectDir: z.string().describe("The project directory. Can be '.' for current project."),
    }),
    execute: async () => {
      const files = project.getContextFiles();
      return JSON.stringify(files);
    },
  });

  const addContextFileTool = tool({
    description: `Adds a file to the Aider context for reading or editing.
Prerequisite: Before using, check the current context with 'get_context_files'. Do NOT add files already present in the context.
Use a relative path for files intended for editing within the project. Use an absolute path for read-only files (e.g., outside the project).`,
    parameters: z.object({
      path: z.string().describe('File path to add to context. Relative to project directory when not read-only. Absolute path should be used when read-only.'),
      readOnly: z.boolean().optional().describe('Whether the file is read-only'),
    }),
    execute: async ({ path: relativePath, readOnly = false }, { toolCallId }) => {
      project.addToolMessage(toolCallId, 'aider', 'add_context_file', { path: relativePath, readOnly });

      const absolutePath = path.resolve(project.baseDir, relativePath);
      let fileExists = false;
      try {
        await fs.access(absolutePath);
        fileExists = true;
      } catch {
        // File does not exist
        fileExists = false;
      }

      if (!fileExists) {
        // Ask user if they want to create the file
        const questionData: QuestionData = {
          baseDir: project.baseDir,
          text: `File '${relativePath}' does not exist. Create it?`,
          defaultAnswer: 'y',
          key: 'tool_aider_add_context_file_create_file',
        };

        const [yesNoAnswer] = await project.askQuestion(questionData);

        if (yesNoAnswer === 'y') {
          try {
            // Create directories if they don't exist
            const dir = path.dirname(absolutePath);
            await fs.mkdir(dir, { recursive: true });
            // Create an empty file
            await fs.writeFile(absolutePath, '');
            project.addLogMessage('info', `Created new file: ${relativePath}`);
            fileExists = true; // File now exists

            try {
              // Add the new file to git staging
              await project.git.add(absolutePath);
            } catch (gitError) {
              const gitErrorMessage = gitError instanceof Error ? gitError.message : String(gitError);
              project.addLogMessage('warning', `Failed to add new file ${relativePath} to git staging area: ${gitErrorMessage}`);
              // Continue even if git add fails, as the file was created successfully
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            project.addLogMessage('error', `Failed to create file '${relativePath}': ${errorMessage}`);
            return `Error: Failed to create file '${relativePath}'. It was not added to the context.`;
          }
        } else {
          return `File '${relativePath}' not created by user. It was not added to the context.`;
        }
      }

      if (fileExists) {
        const added = await project.addFile({
          path: relativePath,
          readOnly,
        });
        return added ? `Added file: ${relativePath}` : `Not added - file '${relativePath}' was already in the context.`;
      } else {
        return `File '${relativePath}' does not exist and was not created. It was not added to the context.`;
      }
    },
  });

  const dropContextFileTool = tool({
    description: `Removes a file from the Aider context.
Note: Unless explicitly requested by the user to remove a specific file, this tool should primarily be used to remove files that were previously added using 'add_context_file' (e.g., after a related 'run_prompt' task is completed).`,
    parameters: z.object({
      path: z.string().describe('File path to remove from context.'),
    }),
    execute: async ({ path }) => {
      project.dropFile(path);
      return `Dropped file: ${path}`;
    },
  });

  const runPromptTool = tool({
    description: `Delegates a natural language coding task to the Aider assistant for execution within the current project context.
Use this tool for:
- Writing new code.
- Modifying or refactoring existing code.
- Explaining code segments.
- Debugging code.
- Implementing new features.

Prerequisites
- All relevant existing project files for the task MUST be added to the Aider context using 'add_context_file' BEFORE calling this tool.

Input:
- A clear, complete, and standalone natural language prompt describing the coding task.

Restrictions:
- Prompts MUST be language-agnostic. Do NOT mention specific programming languages (e.g., Python, JavaScript), libraries, or syntax elements.
- Treat Aider as a capable programmer; provide sufficient detail but avoid excessive handholding.
`,
    parameters: z.object({
      prompt: z.string().describe('The prompt to run in natural language.'),
    }),
    execute: async ({ prompt }, { toolCallId }) => {
      project.addToolMessage(toolCallId, 'aider', 'run_prompt', { prompt });

      const questionData: QuestionData = {
        baseDir: project.baseDir,
        text: 'Approve prompt to run in Aider?',
        subject: prompt,
        defaultAnswer: 'y',
        key: `aider${SERVER_TOOL_SEPARATOR}run_prompt`,
      };

      // Ask the question and wait for the answer
      const [yesNoAnswer, userInput] = await project.askQuestion(questionData);

      const isApproved = yesNoAnswer === 'y';

      if (!isApproved) {
        return {
          responses: [],
          updatedFiles: [],
          error: `Aider prompt execution denied by user.${userInput ? ` User input: ${userInput}` : ''}`,
        };
      }

      const responses = await project.sendPrompt(prompt, 'code', true);

      // Notify that we are still processing after aider finishes
      project.addLogMessage('loading');

      return {
        responses: responses.map((response) => ({
          messageId: response.messageId,
          content: response.content.trim(),
          reflectedMessage: response.reflectedMessage,
        })),
        updatedFiles: responses.flatMap((response) => response.editedFiles || []).filter((value, index, self) => self.indexOf(value) === index), // Unique files
      };
    },
  });

  return {
    [`aider${SERVER_TOOL_SEPARATOR}get_context_files`]: getContextFilesTool,
    [`aider${SERVER_TOOL_SEPARATOR}add_context_file`]: addContextFileTool,
    [`aider${SERVER_TOOL_SEPARATOR}drop_context_file`]: dropContextFileTool,
    [`aider${SERVER_TOOL_SEPARATOR}run_prompt`]: runPromptTool,
  };
};
