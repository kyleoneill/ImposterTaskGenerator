import sqlite3
import requests
import os
import time
import base64
from bs4 import BeautifulSoup

maps = ["The Airship", "MIRA HQ", "Polus", "The Skeld"]
current_id = 0

def deduplicate_and_convert_list(list_of_elements):
    new_list = list()
    [new_list.append(t.string.strip()) for t in list_of_elements if t.string.strip() not in new_list]
    return new_list


def create_table(cursor):
    cursor.execute("""CREATE TABLE Tasks (id INTEGER PRIMARY KEY, name TEXT, map TEXT, types TEXT, location TEXT, image TEXT, createdAt TEXT, updatedAt TEXT)""")


def get_task_list():
    tasks = dict()
    main_page = requests.get("https://among-us.fandom.com/wiki/Tasks")
    soup = BeautifulSoup(main_page.text, 'html.parser')
    links = soup.select("tbody > tr > td:nth-child(1) > a")
    for result in links:
        title = result['title'].strip()
        if title not in maps:
            tasks[title] = result['href']
    return tasks


def build_tasks(task_name, task_href, cursor):
    task_page = requests.get(f"https://among-us.fandom.com{task_href}")
    soup = BeautifulSoup(task_page.text, 'html.parser')
    aside = soup.select_one("aside")

    # Get the maps for this task
    maps = aside.select("section > div:nth-child(2) a")
    map_names = [map_as_text.string.strip() for map_as_text in maps]
    task_map = ';'.join(map_names)

    # Get the task types
    types_html = aside.select("section > div:nth-child(3) a")
    types_list = deduplicate_and_convert_list(types_html)
    types = ';'.join(types_list)

    # Get the task location
    location_html = aside.select("section > div:nth-child(1) > div a")
    location_list = deduplicate_and_convert_list(location_html)
    locations = ';'.join(location_list)

    # Get a picture of the task
    image_html = aside.select_one("img")
    url = image_html['src']
    raw_image_data = requests.get(url)
    encoded_string = base64.b64encode(raw_image_data.content)

    global current_id
    cursor.execute("INSERT INTO Tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (current_id, task_name, task_map, types, locations, encoded_string, None, None))
    current_id += 1


def build_database():
    con = sqlite3.connect("database.sqlite")
    cursor = con.cursor()

    create_table(cursor)
    tasks = get_task_list()
    for name, href in tasks.items():
        build_tasks(name, href, cursor)
        print(f"Finished task: {name}")
        time.sleep(1)
    con.commit()
    con.close()


if __name__ == "__main__":
    if os.path.exists("database.sqlite"):
        os.remove("database.sqlite")
    build_database()
