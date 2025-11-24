IA Used: GPT-5-Mini

# Prompt 1 - Knowing about the applied best practices of the project

Generate a markdown file with the name bestPractices.md into the path prompts/.
Include the explanation of the best practices used in this project.
Use the provided template at prompts/templateBestPractices.md to fill up with real examples of code from the project in each of the practices and add a brief explanation on each example.
The best practices that we must follow are DDD, SOLID, DRY design patterns.


# Prompt 2 - Knowing about the Database Schema
You are an DBA expert, generate a markdown file with the name databaseDocumentation.md an place it into backend/prisma directory.
Include a brief field, relationship explanation and a diagram in mermaid format. @schema.prisma 

# Prompt 3 - Enhancing the User Stories
As product expert, revise the 2 user stories at @userStories.md and improve them below the markdown ##ENHANCED USER STORIES.
Consider following the @userStoryTemplate.md to document in natural languague both requirements, @databaseDocumentation.md to consider the database impact and @bestPractices.md for the standar to commit.
Produce the output in markdown format.

# Prompt 4 - Developing the first User Story [List Candidates for Position]
As an expert software developer, take the User Story [List Candidates for Position] from @userStories.md and produce the required code to achieve the requirements.
Make sure to understand the project structure and technology at @README.md, best practices to follow at @bestPractices.md and @databaseDocumentation.md for the database interactions.

# Prompt 5 - Adding testing to the end point
Now guide me on how to include test classes in the project with jest in order to test the new end point.

# Prompt 6 - Coding the first test 
Only add the positionService.test.ts file to the project, I did the supertest integration already.

# Prompt 7 - Developing the second User Story [Move Candidate Stage]
As an expert software developer, continue now with the User Story [Move Candidate Stage] from @userStories.md and produce the required code to achieve the requirements, aditionaly create the required test file for the service.

# Prompt 8 - Developing the front end 
As web developer expert, let's create a user interface to present the data for the two user stories developed previously.
Here the features to include:
1. In the Dashboard include another Card for "Consultar Candidatos"
2. Using the end point created to get the candidates, the page "Consultar Candidatos" must show the candidates in a Kanban board of 3 columns.
3. The columns must be the 3 steps that candidates must pass thru "Initial Screening", "Technical Interview" and "Manager Interview".
4. the candidates must be displayed in the column according with their current_interview_step.
5. Now using the second end point allowing to move candidates steps, allow the user can drag and drop a candidate from one column to another.
6. Add a button to go back to the dashboard.


# Prompt 9 to 12 - Front End Bug Fixing and Improvements

