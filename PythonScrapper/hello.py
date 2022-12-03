# packages
from urllib.request import unquote
from bs4 import BeautifulSoup
import xlsxwriter
import requests
import tabula
import schedule
import time
import os
# creating excel sheet


def scrapper():

    target1 = 'D:\ReactNative\PythonScrapper\\'
    for x in os.listdir(target1):
        if x.endswith('.pdf') or x.endswith('.csv') or x.endswith('.xlsx'):
            # print('deleting file:', x)
            os.unlink(target1+x)
            # print('File deleted')
    target2 = 'D:\ReactNative\PythonScrapper\pdfs\\'
    for x in os.listdir(target2):
        if x.endswith('.pdf') or x.endswith('.csv') or x.endswith('.xlsx'):
            # print('deleting file:', x)
            os.unlink(target2+x)
            # print('File deleted')

    workbook = xlsxwriter.Workbook("tenderlinks.xlsx")
    worksheet = workbook.add_worksheet("Links")

    # target Url
    # url = 'https://dyysg.org.uk/docs.php'
    url = 'https://www.cda.gov.pk/business_opportunities/procurement/'
    # make Http GET request to the atrget URL
    response = requests.get(url)
    FILE = ""
    # parse content
    content = BeautifulSoup(response.text, 'lxml')
    # extract pdf URLS
    all_urls = content.find_all('a')
    counter = -1
    url_list = []
    tenderNo = []
    # loop over all urls
    for url in all_urls:
        # try urls conatining href attribute
        try:

            # pick up only those urls containing 'pdf' within href attribute
            if 'pdf' and 'tenders' in url['href']:
                counter = counter+1
                # init PDF url
                pdf_url = ''
                # append base url if no http available in url
                if 'https' not in url['href'] and 'https://www.cda.gov.pk/documents/tenders/':
                    # pdf_url = 'https://dyysg.org.uk/docs.php' + url['href']
                    pdf_url = 'https://www.cda.gov.pk/business_opportunities/procurement/' + \
                        url['href']
                else:
                    pdf_url = url['href']
                # make HTTP get request to fetch pdf bytes
                print('HTTP Get: %s', pdf_url)
                pdf_response = requests.get(pdf_url)

                # extract pdf file name
                filename = unquote(pdf_response.url).split(
                    '/')[-1].replace(' ', '_')

                url_list.append(pdf_url)
                tenderNo.append(filename)
                # wriet pdf to local file
                with open(filename, 'wb') as f:  # './pdf/' +
                    f.write(pdf_response.content)
                with open('./pdfs/'+filename, 'wb') as f:  # './pdf/' +
                    f.write(pdf_response.content)

        # skip all other urls
        except Exception as e:
            print('Error:', e)
    # print(url_list)
    # print(tenderNo)

    # worksheet.write('A1', 'https://www.python.org/')
    # for index, entry in enumerate(url_list):
    #     worksheet.write(0, 0, str(index))
    #     worksheet.write(1, 0, entry["Link"])
    for x in range(counter):
        # worksheet.write(x, 0, url_list[x])
        worksheet.write(x, 0, x)
        worksheet.write(x, 1, url_list[x])
    workbook.close()

    # extracting data from pdf
    for i in range(counter):
        pdf_path = tenderNo[i]
        # print(pdf_path)
        dfs = tabula.read_pdf(pdf_path, lattice=True,
                              encoding='cp1252', multiple_tables=False)

        print(pdf_path)

        # data = tabula.convert_into(
        #     "pdfs", output_format="csv", lattice=True, output_path='file.csv')
        # print("data written for:", pdf_path)
        tabula.convert_into_by_batch(
            "pdfs", output_format="csv", lattice=True, output_path=pdf_path)
    # print(pdf_path)
    # print(dfs[0])

# scrapper()


# schedule.every(5).seconds.do(scrapper)
# while 1:
#     schedule.run_pending()
#     time.sleep(1)
