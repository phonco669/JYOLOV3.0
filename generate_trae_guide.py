import os
import re

def extract_frontmatter(content):
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', content, re.DOTALL)
    if match:
        frontmatter_str = match.group(1)
        body = match.group(2)
        metadata = {}
        for line in frontmatter_str.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip().strip('"')
        return metadata, body
    return {}, content

def main():
    base_dir = os.path.join(os.getcwd(), 'superpowers', 'skills')
    output_file = 'TRAE_INSTRUCTIONS.md'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Superpowers for Trae\n\n")
        f.write("To enable Superpowers in your Trae session, please copy the following block and paste it into the chat, or reference this file as context.\n\n")
        
        f.write("## System Instructions\n\n")
        f.write("```markdown\n")
        f.write("<SUPERPOWERS_ACTIVATION>\n")
        f.write("You are now operating with Superpowers. These are strict workflows and capabilities you must follow.\n\n")
        f.write("CRITICAL RULES:\n")
        f.write("1. **Tool Mapping**:\n")
        f.write("   - `TodoWrite` is your primary planning tool (replaces update_plan).\n")
        f.write("   - `RunCommand` replaces shell execution.\n")
        f.write("   - You do NOT have subagents. Perform the tasks yourself sequentially.\n")
        f.write("2. **Mandatory Workflows**:\n")
        f.write("   - Before ANY coding, check if `brainstorming` or `writing-plans` applies.\n")
        f.write("   - ALWAYS use TDD (Test Driven Development) for implementation.\n")
        f.write("   - NEVER skip the planning phase for complex tasks.\n")
        f.write("3. **Skill Usage**:\n")
        f.write("   - The skills below define your behavior. Refer to them constantly.\n")
        f.write("</SUPERPOWERS_ACTIVATION>\n")
        f.write("```\n\n")
        
        f.write("## Available Skills\n\n")
        
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file == 'SKILL.md':
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(root, base_dir)
                    skill_name = rel_path.replace(os.sep, '/')
                    
                    try:
                        with open(full_path, 'r', encoding='utf-8') as sf:
                            content = sf.read()
                            metadata, body = extract_frontmatter(content)
                            
                            description = metadata.get('description', 'No description provided.')
                            
                            f.write(f"### Skill: {skill_name}\n\n")
                            f.write(f"**Description**: {description}\n\n")
                            f.write("<skill_content>\n")
                            f.write(body)
                            f.write("\n</skill_content>\n\n")
                            f.write("---\n\n")
                    except Exception as e:
                        print(f"Error processing {skill_name}: {e}")

    print(f"Generated {output_file}")

if __name__ == "__main__":
    main()
